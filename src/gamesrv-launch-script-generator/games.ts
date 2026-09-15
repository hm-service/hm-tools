export type Proto = "udp" | "tcp";

export interface PortRow {
    host: string;
    container: string;
    proto: Proto;
    required?: boolean;
    desc?: string;
}

export interface VolumeRow {
    host: string;
    container: string;
    required?: boolean;
    desc?: string;
}

export interface EnvRow {
    name: string;
    value: string;
    secret: boolean;
    desc?: string;
}

export interface FlavorResources {
    ports: PortRow[];
    volumes: VolumeRow[];
    env: EnvRow[];
    extraArgs: string;
}

export interface Variant {
    key: string;
    name: string;
    tag: string;
    container: string;
    /**
     * 方案 A：variant 未提供某字段则继承主 resources；
     * 提供则 ports / volumes / env / extraArgs 整组替换。
     */
    resources?: Partial<FlavorResources>;
}

export interface GameInfo {
    schemaVersion: number;
    key: string;
    name: string;
    registries?: {
        ghcr?: string;
        aliyun?: string;
    };
    resources: FlavorResources;
    variants: Variant[];
}

export interface ParsedRepoUrl {
    /** 规范化后的仓库地址（用于历史记录与展示） */
    canonicalUrl: string;
    /** owner/repo 路径（用于加载提示） */
    repoPath: string;
    /** 按顺序尝试的 info.json raw 地址 */
    rawCandidates: string[];
}

export const DEFAULT_REGISTRIES = {
    ghcr: "ghcr.io/hm-gamesrv",
    aliyun: "crpi-i9e7zrpnu4792a5m.cn-chengdu.personal.cr.aliyuncs.com/hiromuraki",
};

const RAW_INFO_URL_PATTERN = /^https?:\/\/raw\.githubusercontent\.com\/([^/]+)\/([^/]+)\/([^/]+)\/info\.json$/i;
const GITHUB_WEB_URL_PATTERN =
    /^(?:https?:\/\/)?(?:www\.)?github\.com\/([^/]+)\/([^/]+?)(?:\.git)?(?:\/(?:tree|blob)\/([^/?#]+))?(?:\/.*)?$/i;
const GITHUB_SSH_URL_PATTERN = /^git@github\.com:([^/]+)\/([^/]+?)(?:\.git)?$/i;
const OWNER_REPO_PATTERN = /^([A-Za-z0-9][A-Za-z0-9._-]*)\/([A-Za-z0-9][A-Za-z0-9._-]*)$/;

export const parseRepoUrl = (input: string): ParsedRepoUrl => {
    const value = input.trim().replace(/\/+$/, "");
    if (!value) throw new Error("请输入仓库地址");

    const rawMatch = value.match(RAW_INFO_URL_PATTERN);
    if (rawMatch) {
        const repoPath = `${rawMatch[1]}/${rawMatch[2]}`;
        return {
            canonicalUrl: value,
            repoPath,
            rawCandidates: [value],
        };
    }

    let owner = "";
    let repo = "";
    let branch = "";

    const sshMatch = value.match(GITHUB_SSH_URL_PATTERN);
    if (sshMatch) {
        owner = sshMatch[1]!;
        repo = sshMatch[2]!;
    } else {
        const webMatch = value.match(GITHUB_WEB_URL_PATTERN);
        if (webMatch) {
            owner = webMatch[1]!;
            repo = webMatch[2]!;
            branch = webMatch[3] ?? "";
        } else {
            const shortMatch = value.match(OWNER_REPO_PATTERN);
            if (shortMatch) {
                owner = shortMatch[1]!;
                repo = shortMatch[2]!;
            }
        }
    }

    if (!owner || !repo) {
        throw new Error(
            "无法解析仓库地址，请输入 GitHub 仓库地址，例如 https://github.com/hm-gamesrv/counter-strike、" +
                "owner/repo、git@github.com:owner/repo.git，或 info.json 的 raw 地址",
        );
    }

    const repoPath = `${owner}/${repo}`;
    const canonicalUrl = branch ? `https://github.com/${repoPath}/tree/${branch}` : `https://github.com/${repoPath}`;
    const rawCandidates = branch
        ? [`https://raw.githubusercontent.com/${repoPath}/${branch}/info.json`]
        : [
              `https://raw.githubusercontent.com/${repoPath}/main/info.json`,
              `https://raw.githubusercontent.com/${repoPath}/master/info.json`,
          ];

    return { canonicalUrl, repoPath, rawCandidates };
};

export const normalizeRegistry = (base: string | undefined, fallback: string): string =>
    (base ?? fallback).replace(/\/+$/, "");

export const mergeResources = (base: FlavorResources, override?: Partial<FlavorResources>): FlavorResources => ({
    ports: override?.ports ?? base.ports,
    volumes: override?.volumes ?? base.volumes,
    env: override?.env ?? base.env,
    extraArgs: override?.extraArgs ?? base.extraArgs,
});
