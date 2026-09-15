<template>
    <div class="flex h-full w-full min-h-0 text-gray-800 font-sans box-border">
        <div class="w-1/2 p-8 overflow-y-auto border-r border-gray-200 box-border">
            <div class="mb-4 flex items-center justify-between gap-3 border-b border-gray-200 pb-2">
                <h2 class="mt-0 text-xl font-semibold">
                    {{ loadedInfo ? loadedInfo.name : "游戏服务器启动脚本" }}
                </h2>
                <button
                    :disabled="!loadedInfo"
                    class="shrink-0 rounded-md border border-sky-600 bg-sky-600 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:border-sky-700 hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-sky-600 disabled:hover:bg-sky-600"
                    @click="resetConfig"
                >
                    重置
                </button>
            </div>

            <div class="mb-4">
                <div class="mb-1.5 flex items-center justify-between gap-3">
                    <label class="block text-sm font-semibold text-gray-600">仓库地址</label>
                    <button
                        v-if="repoHistory.length > 0 && !loading"
                        type="button"
                        class="shrink-0 text-xs font-semibold text-gray-400 transition-colors hover:text-red-600"
                        @click="clearRepoHistory"
                    >
                        清除历史
                    </button>
                </div>
                <div class="relative">
                    <div class="flex items-stretch gap-2">
                        <div class="relative min-w-0 flex-1">
                            <input
                                v-model="repoInput"
                                type="text"
                                autocomplete="off"
                                :disabled="loading"
                                placeholder="https://github.com/hm-gamesrv/counter-strike"
                                class="w-full p-2.5 pr-9 border border-gray-300 rounded-md box-border text-sm font-mono transition-colors focus:outline-none focus:border-black disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-400"
                                @focus="openRepoDropdown"
                                @input="onRepoInput"
                                @keydown.down.prevent="moveRepoHighlight(1)"
                                @keydown.up.prevent="moveRepoHighlight(-1)"
                                @keydown.enter.prevent="onRepoEnter"
                                @keydown.escape="closeRepoDropdown"
                                @blur="closeRepoDropdown"
                            />
                            <button
                                v-if="repoHistory.length > 0 && !loading"
                                type="button"
                                :aria-label="repoDropdownOpen ? '收起输入历史' : '展开输入历史'"
                                class="absolute right-1.5 top-1/2 -translate-y-1/2 rounded-md p-1 text-gray-400 transition-colors cursor-pointer hover:bg-gray-100 hover:text-gray-600"
                                @mousedown.prevent
                                @click="toggleRepoDropdown"
                            >
                                <svg viewBox="0 0 20 20" fill="currentColor" class="h-4 w-4">
                                    <path
                                        fill-rule="evenodd"
                                        d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 11.06l3.71-3.83a.75.75 0 1 1 1.08 1.04l-4.25 4.39a.75.75 0 0 1-1.08 0L5.21 8.27a.75.75 0 0 1 .02-1.06Z"
                                        clip-rule="evenodd"
                                    />
                                </svg>
                            </button>
                        </div>
                        <button
                            type="button"
                            :disabled="loading || !repoInput.trim()"
                            class="shrink-0 rounded-md border border-sky-600 bg-sky-600 px-5 text-sm font-semibold text-white transition-colors hover:border-sky-700 hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-sky-600 disabled:hover:bg-sky-600"
                            @click="submitRepo"
                        >
                            {{ loading ? "加载中…" : "加载" }}
                        </button>
                    </div>
                    <ul
                        v-if="repoDropdownOpen && repoOptions.length > 0"
                        class="absolute left-0 right-0 top-full z-30 mt-1 max-h-56 overflow-y-auto rounded-md border border-gray-200 bg-white p-1 shadow-lg"
                    >
                        <li
                            v-for="(url, index) in repoOptions"
                            :key="url"
                            :title="url"
                            class="cursor-pointer truncate rounded px-2.5 py-2 font-mono text-xs transition-colors"
                            :class="
                                index === repoHighlightIndex
                                    ? 'bg-sky-600 text-white'
                                    : 'text-gray-700 hover:bg-gray-100'
                            "
                            @mousedown.prevent
                            @mouseenter="repoHighlightIndex = index"
                            @click="selectRepoOption(url)"
                        >
                            {{ url }}
                        </li>
                    </ul>
                </div>
                <p class="mt-1.5 text-xs text-gray-400">
                    支持 GitHub 仓库地址（如
                    https://github.com/hm-gamesrv/counter-strike、owner/repo、git@github.com:owner/repo.git）或
                    info.json 的 raw 地址；输入历史保存在本地。
                </p>
            </div>

            <div
                v-if="loading"
                class="flex items-center gap-2 rounded-md border border-gray-200 bg-gray-50 px-4 py-5 text-sm text-gray-500"
            >
                <span
                    class="inline-block h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-gray-300 border-t-sky-600"
                ></span>
                正在加载 {{ currentRepoLabel }} 的 info.json…
            </div>
            <div v-else-if="loadError" class="rounded-md border border-red-200 bg-red-50 p-4">
                <p class="text-sm font-semibold text-red-600">加载失败：{{ loadError }}</p>
                <button
                    class="mt-2 rounded-md border border-red-200 bg-white px-3 py-1.5 text-xs font-semibold text-red-600 transition-colors hover:bg-red-600 hover:text-white hover:border-red-600"
                    @click="retryLoad"
                >
                    重试
                </button>
            </div>
            <div
                v-else-if="!loadedInfo"
                class="rounded-md border border-dashed border-gray-300 px-4 py-8 text-center text-sm text-gray-400"
            >
                输入仓库地址并点击“加载”以读取 info.json
            </div>

            <template v-else>
                <div class="mb-4">
                    <label class="block text-sm font-semibold mb-1.5 text-gray-600">变体</label>
                    <select
                        v-model="config.selectedFlavorKey"
                        @change="onVariantChange"
                        class="w-full p-2.5 border border-gray-300 rounded-md box-border text-sm transition-colors focus:outline-none focus:border-black"
                    >
                        <option v-for="variant in loadedInfo?.variants ?? []" :key="variant.key" :value="variant.key">
                            {{ variant.name }}
                        </option>
                    </select>
                </div>

                <div class="mb-4 grid grid-cols-2 gap-4">
                    <div>
                        <label class="block text-sm font-semibold mb-1.5 text-gray-600">实例序号</label>
                        <input
                            v-model.number="config.instance"
                            type="number"
                            min="1"
                            class="w-full p-2.5 border border-gray-300 rounded-md box-border text-sm transition-colors focus:outline-none focus:border-black"
                        />
                        <p class="mt-1 text-xs text-gray-400">
                            &gt;1 时容器名/卷路径加 -N，主机端口 +N-1（多实例靠卷隔离）
                        </p>
                    </div>
                    <div>
                        <label class="block text-sm font-semibold mb-1.5 text-gray-600">容器名</label>
                        <input
                            v-model="config.containerName"
                            class="w-full p-2.5 border border-gray-300 rounded-md box-border text-sm font-mono transition-colors focus:outline-none focus:border-black"
                        />
                    </div>
                </div>

                <div class="mb-4 flex items-center gap-2">
                    <input id="prefetch" v-model="config.prefetch" type="checkbox" class="h-4 w-4" />
                    <label for="prefetch" class="text-sm font-semibold text-gray-600">预取阿里云镜像</label>
                </div>

                <h3 class="text-base font-semibold my-4 text-gray-600">端口</h3>
                <div v-for="(row, index) in config.ports" :key="'p' + index" class="flex gap-2 mb-2.5 items-center">
                    <span
                        class="group relative inline-flex h-5 w-5 shrink-0 cursor-help items-center justify-center rounded-full border border-gray-300 text-[11px] font-semibold text-gray-400"
                    >
                        ?
                        <span
                            v-if="row.desc"
                            class="pointer-events-none absolute left-full top-1/2 z-50 ml-1.5 -translate-y-1/2 w-max max-w-[16rem] whitespace-normal rounded-md bg-gray-900 px-2 py-1 text-xs font-normal text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100"
                        >
                            {{ row.desc }}
                        </span>
                    </span>
                    <input
                        v-model="row.host"
                        placeholder="主机端口"
                        class="flex-1 p-2.5 border border-gray-300 rounded-md box-border text-sm font-mono transition-colors focus:outline-none focus:border-black"
                    />
                    <input
                        v-model="row.container"
                        placeholder="容器端口"
                        :readonly="row.required"
                        class="flex-1 p-2.5 border border-gray-300 rounded-md box-border text-sm font-mono transition-colors focus:outline-none focus:border-black read-only:cursor-not-allowed read-only:bg-gray-100 read-only:text-gray-400"
                    />
                    <select
                        v-model="row.proto"
                        :disabled="row.required"
                        class="p-2.5 border border-gray-300 rounded-md box-border text-sm transition-colors focus:outline-none focus:border-black disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-400"
                    >
                        <option value="udp">udp</option>
                        <option value="tcp">tcp</option>
                    </select>
                    <span
                        v-if="row.required"
                        class="inline-flex shrink-0 items-center justify-center rounded-md border border-amber-300 bg-amber-100 px-3 py-1.5 text-xs font-semibold text-amber-700"
                    >
                        必需
                    </span>
                    <button
                        v-if="!row.required"
                        class="inline-flex shrink-0 items-center justify-center rounded-md border border-red-200 bg-white px-3 py-1.5 text-xs font-semibold text-red-600 transition-colors cursor-pointer hover:bg-red-600 hover:text-white hover:border-red-600"
                        @click="removePort(index)"
                    >
                        删除
                    </button>
                </div>
                <button
                    class="w-full px-4 py-2 bg-white border border-dashed border-gray-300 rounded-md cursor-pointer text-sm font-semibold transition-colors text-gray-600 mt-1 hover:border-black hover:text-black"
                    @click="addPort"
                >
                    + 添加端口
                </button>

                <h3 class="text-base font-semibold my-4 text-gray-600">卷</h3>
                <div v-for="(row, index) in config.volumes" :key="'v' + index" class="flex gap-2 mb-2.5 items-center">
                    <span
                        class="group relative inline-flex h-5 w-5 shrink-0 cursor-help items-center justify-center rounded-full border border-gray-300 text-[11px] font-semibold text-gray-400"
                    >
                        ?
                        <span
                            v-if="row.desc"
                            class="pointer-events-none absolute left-full top-1/2 z-50 ml-1.5 -translate-y-1/2 w-max max-w-[16rem] whitespace-normal rounded-md bg-gray-900 px-2 py-1 text-xs font-normal text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100"
                        >
                            {{ row.desc }}
                        </span>
                    </span>
                    <input
                        v-model="row.host"
                        placeholder="./data"
                        class="flex-1 p-2.5 border border-gray-300 rounded-md box-border text-sm font-mono transition-colors focus:outline-none focus:border-black"
                    />
                    <input
                        v-model="row.container"
                        placeholder="/app"
                        :readonly="row.required"
                        class="flex-1 p-2.5 border border-gray-300 rounded-md box-border text-sm font-mono transition-colors focus:outline-none focus:border-black read-only:cursor-not-allowed read-only:bg-gray-100 read-only:text-gray-400"
                    />
                    <span
                        v-if="row.required"
                        class="inline-flex shrink-0 items-center justify-center rounded-md border border-amber-300 bg-amber-100 px-3 py-1.5 text-xs font-semibold text-amber-700"
                    >
                        必需
                    </span>
                    <button
                        v-if="!row.required"
                        class="inline-flex shrink-0 items-center justify-center rounded-md border border-red-200 bg-white px-3 py-1.5 text-xs font-semibold text-red-600 transition-colors cursor-pointer hover:bg-red-600 hover:text-white hover:border-red-600"
                        @click="removeVolume(index)"
                    >
                        删除
                    </button>
                </div>
                <button
                    class="w-full px-4 py-2 bg-white border border-dashed border-gray-300 rounded-md cursor-pointer text-sm font-semibold transition-colors text-gray-600 mt-1 hover:border-black hover:text-black"
                    @click="addVolume"
                >
                    + 添加卷
                </button>

                <h3 class="text-base font-semibold my-4 text-gray-600">环境变量</h3>
                <div v-for="(row, index) in config.env" :key="'e' + index" class="flex gap-2 mb-2.5 items-center">
                    <span
                        class="group relative inline-flex h-5 w-5 shrink-0 cursor-help items-center justify-center rounded-full border border-gray-300 text-[11px] font-semibold text-gray-400"
                    >
                        ?
                        <span
                            v-if="row.desc"
                            class="pointer-events-none absolute left-full top-1/2 z-50 ml-1.5 -translate-y-1/2 w-max max-w-[16rem] whitespace-normal rounded-md bg-gray-900 px-2 py-1 text-xs font-normal text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100"
                        >
                            {{ row.desc }}
                        </span>
                    </span>
                    <input
                        v-model="row.name"
                        placeholder="VAR_NAME"
                        class="flex-1 p-2.5 border border-gray-300 rounded-md box-border text-sm font-mono transition-colors focus:outline-none focus:border-black"
                    />
                    <input
                        v-model="row.value"
                        :type="row.secret ? 'password' : 'text'"
                        placeholder="值"
                        class="flex-1 p-2.5 border border-gray-300 rounded-md box-border text-sm font-mono transition-colors focus:outline-none focus:border-black"
                    />
                    <label class="flex shrink-0 items-center gap-1 text-xs font-semibold text-gray-500">
                        <input v-model="row.secret" type="checkbox" class="h-4 w-4" />
                        敏感
                    </label>
                    <button
                        class="inline-flex shrink-0 items-center justify-center rounded-md border border-red-200 bg-white px-3 py-1.5 text-xs font-semibold text-red-600 transition-colors cursor-pointer hover:bg-red-600 hover:text-white hover:border-red-600"
                        @click="removeEnv(index)"
                    >
                        删除
                    </button>
                </div>
                <button
                    class="w-full px-4 py-2 bg-white border border-dashed border-gray-300 rounded-md cursor-pointer text-sm font-semibold transition-colors text-gray-600 mt-1 hover:border-black hover:text-black"
                    @click="addEnv"
                >
                    + 添加环境变量
                </button>
                <p class="mt-1 text-xs text-gray-400">
                    勾选"敏感"的变量不写入脚本，生成 ${NAME:?未设置} 占位，运行时从 shell 环境读取。
                </p>

                <h3 class="text-base font-semibold my-4 text-gray-600">附加参数</h3>
                <input
                    v-model="config.extraArgs"
                    placeholder="如 bash（GTNH 进 shell）"
                    class="w-full p-2.5 border border-gray-300 rounded-md box-border text-sm font-mono transition-colors focus:outline-none focus:border-black"
                />

                <div class="mt-5 space-y-1.5">
                    <p
                        v-for="(msg, index) in validationMessages"
                        :key="index"
                        class="rounded-md px-3 py-2 text-xs font-semibold"
                        :class="msgClass(msg.kind)"
                    >
                        {{ msg.text }}
                    </p>
                </div>
                <div class="h-12"></div>
            </template>
        </div>

        <div class="w-1/2 p-8 bg-gray-50 overflow-y-auto box-border flex flex-col min-h-0">
            <div class="mb-4 flex items-center justify-between gap-3 border-b border-gray-200 pb-2">
                <h2 class="mt-0 text-xl font-semibold">启动脚本预览</h2>
                <div class="flex gap-2">
                    <button
                        :disabled="!loadedInfo"
                        class="shrink-0 rounded-md border border-sky-600 bg-sky-600 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:border-sky-700 hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-sky-600 disabled:hover:bg-sky-600"
                        @click="copyScript"
                    >
                        复制
                    </button>
                    <button
                        :disabled="!loadedInfo"
                        class="shrink-0 rounded-md border border-gray-300 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 transition-colors hover:border-gray-400 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40"
                        @click="downloadScript"
                    >
                        下载 .sh
                    </button>
                </div>
            </div>
            <pre
                v-if="generatedScript"
                class="bg-white p-5 rounded-lg border border-gray-200 font-mono text-sm leading-relaxed overflow-x-auto grow whitespace-pre-wrap break-words shadow-inner"
                >{{ generatedScript }}</pre>
            <div
                v-else
                class="flex grow items-center justify-center rounded-lg border border-dashed border-gray-300 text-sm text-gray-400"
            >
                <span v-if="loading">正在加载…</span>
                <span v-else-if="loadError">加载失败</span>
                <span v-else>请输入仓库地址并点击“加载”</span>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from "vue";
import {
    DEFAULT_REGISTRIES,
    mergeResources,
    normalizeRegistry,
    parseRepoUrl,
    type EnvRow,
    type FlavorResources,
    type GameInfo,
    type ParsedRepoUrl,
    type PortRow,
    type Variant,
    type VolumeRow,
} from "./games";

interface GeneratorState {
    selectedFlavorKey: string;
    containerName: string;
    ports: PortRow[];
    volumes: VolumeRow[];
    env: EnvRow[];
    extraArgs: string;
    prefetch: boolean;
    instance: number;
}

interface ValidationMessage {
    kind: "error" | "warning" | "ok";
    text: string;
}

const createDefaultState = (): GeneratorState => ({
    selectedFlavorKey: "",
    containerName: "",
    ports: [],
    volumes: [],
    env: [],
    extraArgs: "",
    prefetch: true,
    instance: 1,
});

const config = reactive<GeneratorState>(createDefaultState());

const REPO_HISTORY_KEY = "hm-tools.gamesrv-launch-script-generator.repo-history";
const REPO_HISTORY_LIMIT = 20;

const readRepoHistory = (): string[] => {
    try {
        const raw = localStorage.getItem(REPO_HISTORY_KEY);
        if (!raw) return [];
        const parsed: unknown = JSON.parse(raw);
        if (!Array.isArray(parsed)) return [];
        return parsed.filter((item): item is string => typeof item === "string").slice(0, REPO_HISTORY_LIMIT);
    } catch {
        return [];
    }
};

const infoCache = new Map<string, GameInfo>();
const loadedInfo = ref<GameInfo | null>(null);
const loading = ref(false);
const loadError = ref<string | null>(null);

const repoHistory = ref<string[]>(readRepoHistory());
const repoInput = ref("");
const repoDropdownOpen = ref(false);
const repoHighlightIndex = ref(-1);
const pendingRepo = ref<ParsedRepoUrl | null>(null);

const repoOptions = computed<string[]>(() => {
    if (!repoDropdownOpen.value) return [];
    const keyword = repoInput.value.trim().toLowerCase();
    if (!keyword) return repoHistory.value;
    return repoHistory.value.filter((url) => url.toLowerCase().includes(keyword));
});

const currentRepoLabel = computed<string>(() => {
    const repo = pendingRepo.value;
    if (repo) return repo.repoPath;
    return repoInput.value.trim() || "仓库";
});

const persistRepoHistory = () => {
    try {
        localStorage.setItem(REPO_HISTORY_KEY, JSON.stringify(repoHistory.value));
    } catch (error) {
        console.error("保存仓库输入历史失败", error);
    }
};

const rememberRepoUrl = (url: string) => {
    const next = [url, ...repoHistory.value.filter((item) => item !== url)];
    repoHistory.value = next.slice(0, REPO_HISTORY_LIMIT);
    persistRepoHistory();
};

const clearRepoHistory = () => {
    repoHistory.value = [];
    closeRepoDropdown();
    try {
        localStorage.removeItem(REPO_HISTORY_KEY);
    } catch (error) {
        console.error("清除仓库输入历史失败", error);
    }
};

const openRepoDropdown = () => {
    if (repoHistory.value.length > 0) repoDropdownOpen.value = true;
};

const closeRepoDropdown = () => {
    repoDropdownOpen.value = false;
    repoHighlightIndex.value = -1;
};

const toggleRepoDropdown = () => {
    repoDropdownOpen.value = !repoDropdownOpen.value;
    if (!repoDropdownOpen.value) repoHighlightIndex.value = -1;
};

const onRepoInput = () => {
    repoDropdownOpen.value = true;
    repoHighlightIndex.value = -1;
};

const moveRepoHighlight = (delta: number) => {
    if (!repoDropdownOpen.value) {
        repoDropdownOpen.value = true;
        repoHighlightIndex.value = -1;
    }
    const options = repoOptions.value;
    if (options.length === 0) return;
    const current = repoHighlightIndex.value;
    repoHighlightIndex.value =
        current < 0 ? (delta > 0 ? 0 : options.length - 1) : (current + delta + options.length) % options.length;
};

const onRepoEnter = () => {
    const options = repoOptions.value;
    const highlighted = repoHighlightIndex.value;
    closeRepoDropdown();
    if (highlighted >= 0 && options[highlighted]) {
        repoInput.value = options[highlighted]!;
    }
    submitRepo();
};

const selectRepoOption = (url: string) => {
    closeRepoDropdown();
    repoInput.value = url;
    submitRepo();
};

const activeVariant = computed<Variant | null>(() => {
    const info = loadedInfo.value;
    return info?.variants.find((variant) => variant.key === config.selectedFlavorKey) ?? null;
});

const activeResources = computed<FlavorResources | null>(() => {
    const info = loadedInfo.value;
    const variant = activeVariant.value;
    if (!info || !variant) return null;
    return mergeResources(info.resources, variant.resources);
});

const applyVariant = (info: GameInfo, variant: Variant) => {
    const resources = mergeResources(info.resources, variant.resources);
    config.containerName = variant.container;
    config.ports = resources.ports.map((port) => ({ ...port }));
    config.volumes = resources.volumes.map((volume) => ({ ...volume }));
    config.env = resources.env.map((item) => ({ ...item }));
    config.extraArgs = resources.extraArgs;
};

const applyGame = (info: GameInfo) => {
    loadedInfo.value = info;
    loadError.value = null;
    const variant = info.variants.find((item) => item.key === config.selectedFlavorKey) ?? info.variants[0]!;
    config.selectedFlavorKey = variant.key;
    applyVariant(info, variant);
};

const fetchGameInfo = async (rawCandidates: string[]): Promise<GameInfo> => {
    let lastError: Error = new Error("加载失败");
    for (const rawUrl of rawCandidates) {
        try {
            const response = await fetch(rawUrl);
            if (!response.ok) {
                lastError = new Error(`HTTP ${response.status}（${rawUrl}）`);
                continue;
            }
            return (await response.json()) as GameInfo;
        } catch (error) {
            if (error instanceof SyntaxError) {
                lastError = new Error(`info.json 解析失败（${rawUrl}）`);
            } else {
                lastError = error instanceof Error ? error : new Error(String(error));
            }
        }
    }
    throw lastError;
};

const loadRepo = async (parsed: ParsedRepoUrl) => {
    const cached = infoCache.get(parsed.canonicalUrl);
    if (cached) {
        applyGame(cached);
        rememberRepoUrl(parsed.canonicalUrl);
        return;
    }

    loading.value = true;
    loadError.value = null;
    loadedInfo.value = null;
    try {
        const info = await fetchGameInfo(parsed.rawCandidates);
        if (info.schemaVersion !== 1) {
            throw new Error(`不支持的 schemaVersion: ${info.schemaVersion}`);
        }
        if (!Array.isArray(info.variants) || info.variants.length === 0) {
            throw new Error("variants 为空");
        }
        infoCache.set(parsed.canonicalUrl, info);
        applyGame(info);
        rememberRepoUrl(parsed.canonicalUrl);
    } catch (error) {
        loadError.value = error instanceof Error ? error.message : String(error);
    } finally {
        loading.value = false;
    }
};

const submitRepo = () => {
    if (loading.value) return;
    closeRepoDropdown();
    loadError.value = null;
    loadedInfo.value = null;
    config.selectedFlavorKey = "";

    const input = repoInput.value.trim();
    if (!input) {
        loadError.value = "请输入仓库地址";
        return;
    }

    let parsed: ParsedRepoUrl;
    try {
        parsed = parseRepoUrl(input);
    } catch (error) {
        loadError.value = error instanceof Error ? error.message : String(error);
        return;
    }

    repoInput.value = parsed.canonicalUrl;
    pendingRepo.value = parsed;
    void loadRepo(parsed);
};

const onVariantChange = () => {
    const info = loadedInfo.value;
    const variant = activeVariant.value;
    if (info && variant) {
        applyVariant(info, variant);
    }
};

const retryLoad = () => {
    void submitRepo();
};

const addPort = () => config.ports.push({ host: "", container: "", proto: "tcp" });
const removePort = (index: number) => config.ports.splice(index, 1);
const addVolume = () => config.volumes.push({ host: "", container: "" });
const removeVolume = (index: number) => config.volumes.splice(index, 1);
const addEnv = () => config.env.push({ name: "", value: "", secret: false });
const removeEnv = (index: number) => config.env.splice(index, 1);

const resetConfig = () => {
    config.prefetch = true;
    config.instance = 1;
    const info = loadedInfo.value;
    const variant = activeVariant.value;
    if (info && variant) {
        applyVariant(info, variant);
    }
};

const instanceNumber = computed(() => {
    const value = Math.trunc(Number(config.instance));
    return Number.isFinite(value) && value > 1 ? value : 1;
});

const instanceSuffix = computed(() => (instanceNumber.value > 1 ? `-${instanceNumber.value}` : ""));

const generatedScript = computed(() => {
    const info = loadedInfo.value;
    const variant = activeVariant.value;
    const resources = activeResources.value;
    if (!info || !variant || !resources) return "";

    const ghcr = normalizeRegistry(info.registries?.ghcr, DEFAULT_REGISTRIES.ghcr);
    const aliyun = normalizeRegistry(info.registries?.aliyun, DEFAULT_REGISTRIES.aliyun);
    const inst = instanceNumber.value;
    const suffix = instanceSuffix.value;
    const lines: string[] = ["#!/bin/bash", "set -euo pipefail", ""];

    const comments: string[] = [];
    const portDescs = resources.ports.filter((port) => port.desc);
    const volumeDescs = resources.volumes.filter((volume) => volume.desc);
    const envDescs = resources.env.filter((item) => item.desc);
    if (portDescs.length > 0) {
        comments.push("# 端口");
        for (const port of portDescs) {
            comments.push(`#   ${port.container}/${port.proto} ${port.desc}`);
        }
    }
    if (volumeDescs.length > 0) {
        comments.push("# 卷");
        for (const volume of volumeDescs) {
            comments.push(`#   ${volume.container} ${volume.desc}`);
        }
    }
    if (envDescs.length > 0) {
        comments.push("# 环境变量");
        for (const item of envDescs) {
            comments.push(`#   ${item.name} ${item.desc}`);
        }
    }
    if (comments.length > 0) lines.push(...comments, "");

    const volumeHosts = [
        ...new Set(
            config.volumes
                .filter((volume) => volume.host)
                .map((volume) => (inst > 1 ? `${volume.host}${suffix}` : volume.host)),
        ),
    ];
    if (volumeHosts.length > 0) {
        lines.push("# 卷目录检查");
        for (const host of volumeHosts) {
            lines.push(`mkdir -p ${host}`);
        }
        lines.push("");
    }

    const portSpecs = [
        ...new Set(
            config.ports
                .filter((port) => port.host && port.container)
                .map((port) => {
                    const hostNumber = Number(port.host);
                    const host = inst > 1 && Number.isFinite(hostNumber) ? hostNumber + inst - 1 : port.host;
                    return `${host}/${port.proto}`;
                }),
        ),
    ];
    if (portSpecs.length > 0) {
        lines.push(
            "# 端口占用检查",
            "if command -v ss >/dev/null 2>&1; then",
            `    for spec in ${portSpecs.map((spec) => `"${spec}"`).join(" ")}; do`,
            '        port="${spec%/*}"',
            '        proto="${spec#*/}"',
            "        if ss -l\"${proto:0:1}n\" | awk '{print $4}' | sed 's/.*://' | grep -qx \"$port\"; then",
            '            echo "[启动] 端口 $port/$proto 已被占用" >&2',
            "            exit 1",
            "        fi",
            "    done",
            "fi",
            "",
        );
    }

    if (config.prefetch) {
        lines.push(`podman pull ${aliyun}/${info.key}:${variant.tag}`, "");
    }
    lines.push(
        `IMAGE=${ghcr}/${info.key}:${variant.tag}`,
        "",
        'if ! podman pull "$IMAGE"; then',
        "    exit 1",
        "fi",
        "",
    );

    const run: string[] = [
        "podman run --rm -it",
        `    --name ${config.containerName}${suffix}`,
        "    --userns keep-id",
        "    --network pasta",
    ];

    for (const row of config.ports) {
        if (!row.host || !row.container) continue;
        const hostNumber = Number(row.host);
        const host = inst > 1 && Number.isFinite(hostNumber) ? String(hostNumber + inst - 1) : row.host;
        run.push(`    -p ${host}:${row.container}/${row.proto}`);
    }

    for (const row of config.volumes) {
        if (!row.host || !row.container) continue;
        const host = inst > 1 ? `${row.host}${suffix}` : row.host;
        run.push(`    -v ${host}:${row.container}`);
    }

    for (const row of config.env) {
        const name = row.name.trim();
        if (!name) continue;
        if (row.secret) {
            run.push(`    -e ${name}="\${${name}:}"`);
        } else if (row.value !== "") {
            run.push(`    -e ${name}=${row.value}`);
        }
    }

    run.push(`    "$IMAGE"${config.extraArgs ? ` ${config.extraArgs}` : ""}`);
    lines.push(run.join(" \\\n"));
    return lines.join("\n") + "\n";
});

const validationMessages = computed<ValidationMessage[]>(() => {
    const messages: ValidationMessage[] = [];
    const resources = activeResources.value;
    if (!resources) return messages;

    if (!config.containerName.trim()) {
        messages.push({ kind: "error", text: "容器名为空" });
    }

    const mountedVolumes = new Set(config.volumes.map((volume) => volume.container));
    for (const required of resources.volumes.filter((volume) => volume.required)) {
        if (!mountedVolumes.has(required.container)) {
            messages.push({ kind: "error", text: `必需卷 ${required.container} 不能移除` });
        }
    }

    const mountedPorts = new Set(config.ports.map((port) => `${port.container}:${port.proto}`));
    for (const required of resources.ports.filter((port) => port.required)) {
        if (!mountedPorts.has(`${required.container}:${required.proto}`)) {
            messages.push({
                kind: "error",
                text: `必需端口 ${required.container}/${required.proto} 不能移除`,
            });
        }
    }

    const seen = new Set<string>();
    for (const row of config.ports) {
        if (!row.host) continue;
        const key = `${row.host}:${row.proto}`;
        if (seen.has(key)) {
            messages.push({ kind: "warning", text: `主机端口 ${key} 重复` });
        }
        seen.add(key);
    }

    for (const row of config.env) {
        if (row.name.trim() && !row.secret && row.value === "") {
            messages.push({
                kind: "warning",
                text: `环境变量 ${row.name.trim()} 未填值（可勾选"敏感"改为运行时读取）`,
            });
        }
    }

    if (messages.length === 0) {
        messages.push({ kind: "ok", text: "校验通过" });
    }
    return messages;
});

const msgClass = (kind: ValidationMessage["kind"]): string =>
    ({
        error: "bg-red-50 text-red-600",
        warning: "bg-amber-50 text-amber-600",
        ok: "bg-emerald-50 text-emerald-600",
    })[kind];

const fileName = computed(() => {
    const info = loadedInfo.value;
    const variant = activeVariant.value;
    if (!info || !variant) return "start.sh";
    return `start-${info.key}-${variant.key}${instanceSuffix.value}.sh`;
});

const copyScript = async () => {
    try {
        await navigator.clipboard.writeText(generatedScript.value);
    } catch (error) {
        console.error(error);
    }
};

const downloadScript = () => {
    const blob = new Blob([generatedScript.value], { type: "text/x-shellscript" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName.value;
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
};
</script>
