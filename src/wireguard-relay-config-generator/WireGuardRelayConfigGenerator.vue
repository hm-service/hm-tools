<template>
    <div class="flex h-full w-full min-h-0 text-gray-800 font-sans box-border">
        <div class="w-1/2 p-8 overflow-y-auto border-r border-gray-200 box-border">
            <div class="mb-4 flex items-center justify-between gap-3 border-b border-gray-200 pb-2">
                <h2 class="mt-0 text-xl font-semibold">WireGuard 接口配置 (Interface)</h2>
                <div class="flex shrink-0 items-center gap-2">
                    <button
                        type="button"
                        class="shrink-0 rounded-md border border-gray-300 bg-white px-3 py-1.5 text-xs font-semibold text-gray-600 transition-colors hover:border-gray-500 hover:text-gray-900"
                        @click="openImportFilePicker"
                    >
                        导入
                    </button>
                    <button
                        type="button"
                        class="shrink-0 rounded-md border border-sky-600 bg-sky-600 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:border-sky-700 hover:bg-sky-700"
                        @click="resetConfig"
                    >
                        重置
                    </button>
                    <input
                        ref="importFileInputRef"
                        type="file"
                        accept=".zip,application/zip,application/x-zip-compressed"
                        class="hidden"
                        @change="handleImportFile"
                    />
                </div>
            </div>

            <div
                v-if="configIssues.length"
                class="mb-4 rounded-md border border-red-300 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700"
            >
                <div v-for="issue in configIssues" :key="issue">{{ issue }}</div>
            </div>

            <div class="mb-4">
                <label class="block text-sm font-semibold mb-1.5 text-gray-600">域名/IP</label>
                <input
                    type="text"
                    v-model="config.relayServer"
                    placeholder="例如: relay.example.com"
                    class="w-full p-2.5 border border-gray-300 rounded-md box-border text-sm font-mono transition-colors focus:outline-none focus:border-black"
                />
            </div>

            <div class="mb-4">
                <label class="block text-sm font-semibold mb-1.5 text-gray-600">Address (主机 IP)</label>
                <div class="flex items-center gap-2">
                    <input
                        type="text"
                        v-model="config.host"
                        placeholder="例如: 10.8.0.1"
                        class="min-w-0 flex-1 p-2.5 border border-gray-300 rounded-md box-border text-sm font-mono transition-colors focus:outline-none focus:border-black"
                    />
                    <span class="shrink-0 rounded-md bg-gray-100 px-3 py-2 text-xs font-semibold text-gray-500">
                        /24
                    </span>
                </div>
            </div>

            <div class="mb-4">
                <label class="block text-sm font-semibold mb-1.5 text-gray-600">ListenPort (监听端口)</label>
                <input
                    type="number"
                    v-model.number="config.port"
                    class="w-full p-2.5 border border-gray-300 rounded-md box-border text-sm font-mono transition-colors focus:outline-none focus:border-black"
                />
            </div>

            <div class="mb-4">
                <label class="block text-sm font-semibold mb-1.5 text-gray-600">MTU</label>
                <input
                    type="number"
                    v-model.number="config.mtu"
                    class="w-full p-2.5 border border-gray-300 rounded-md box-border text-sm font-mono transition-colors focus:outline-none focus:border-black"
                />
            </div>

            <div class="mb-4">
                <label class="block text-sm font-semibold mb-1.5 text-gray-600">PrivateKey (私钥)</label>
                <div class="relative">
                    <input
                        :type="showInterfacePrivateKey ? 'text' : 'password'"
                        v-model="config.privateKey"
                        @input="derivePublicKey"
                        class="w-full p-2.5 pr-16 border border-gray-300 rounded-md box-border text-sm font-mono transition-colors focus:outline-none focus:border-black"
                    />
                    <button
                        class="absolute right-10 top-1/2 -translate-y-1/2 rounded-md p-1 text-gray-400 transition-colors hover:text-gray-700"
                        type="button"
                        :aria-label="showInterfacePrivateKey ? '隐藏私钥' : '显示私钥'"
                        :title="showInterfacePrivateKey ? '隐藏私钥' : '显示私钥'"
                        @click="showInterfacePrivateKey = !showInterfacePrivateKey"
                    >
                        <svg
                            v-if="showInterfacePrivateKey"
                            viewBox="0 0 20 20"
                            class="h-4 w-4"
                            fill="none"
                            aria-hidden="true"
                        >
                            <path
                                d="M2.5 10s2.7-5.5 7.5-5.5S17.5 10 17.5 10s-2.7 5.5-7.5 5.5S2.5 10 2.5 10Z"
                                stroke="currentColor"
                                stroke-width="1.6"
                            />
                            <circle cx="10" cy="10" r="2.2" stroke="currentColor" stroke-width="1.6" />
                        </svg>
                        <svg v-else viewBox="0 0 20 20" class="h-4 w-4" fill="none" aria-hidden="true">
                            <path d="M3.5 4.5l13 11" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" />
                            <path
                                d="M4.5 10s2.5-5 5.5-5c1.1 0 2.1.4 3 .9"
                                stroke="currentColor"
                                stroke-width="1.6"
                                stroke-linecap="round"
                                stroke-linejoin="round"
                            />
                            <path
                                d="M15.5 10s-2.5 5-5.5 5c-1.1 0-2.1-.4-3-.9"
                                stroke="currentColor"
                                stroke-width="1.6"
                                stroke-linecap="round"
                                stroke-linejoin="round"
                            />
                        </svg>
                    </button>
                    <button
                        class="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-gray-400 transition-colors hover:text-gray-700"
                        type="button"
                        title="重新生成密钥对"
                        aria-label="重新生成密钥对"
                        @click="generateKeys"
                    >
                        <svg viewBox="0 0 20 20" class="h-4 w-4" fill="none" aria-hidden="true">
                            <path
                                d="M16 10a6 6 0 1 1-1.4-3.8"
                                stroke="currentColor"
                                stroke-width="1.6"
                                stroke-linecap="round"
                            />
                            <path
                                d="M15.5 3.5v3.5H12"
                                stroke="currentColor"
                                stroke-width="1.6"
                                stroke-linecap="round"
                                stroke-linejoin="round"
                            />
                        </svg>
                    </button>
                </div>
            </div>

            <div class="mb-4">
                <label class="block text-sm font-semibold mb-1.5 text-gray-600"
                    >PublicKey (公钥 - 由私钥自动生成)</label
                >
                <div class="flex items-center gap-2">
                    <input
                        type="text"
                        v-model="config.publicKey"
                        readonly
                        class="min-w-0 flex-1 p-2.5 border border-gray-300 rounded-md box-border text-sm font-mono transition-colors focus:outline-none bg-gray-100 text-gray-500 cursor-not-allowed"
                    />
                    <button
                        class="shrink-0 rounded-md border border-sky-600 bg-sky-600 px-3 py-2 text-xs font-semibold text-white transition-colors hover:border-sky-700 hover:bg-sky-700"
                        type="button"
                        @click="copyPublicKey"
                    >
                        复制
                    </button>
                </div>
            </div>

            <h3 class="text-base font-semibold my-4 text-gray-600">PostUp 规则</h3>
            <div class="mb-5">
                <div class="flex gap-2 mb-2.5 items-center" v-for="(_, index) in config.postUp" :key="'up' + index">
                    <input
                        type="text"
                        v-model="config.postUp[index]"
                        class="flex-1 p-2.5 border border-gray-300 rounded-md box-border text-sm font-mono transition-colors focus:outline-none focus:border-black"
                    />
                    <button
                        class="px-3 py-1.5 text-red-600 border border-red-200 bg-white rounded-md cursor-pointer text-xs font-semibold transition-colors hover:bg-red-600 hover:text-white hover:border-red-600"
                        @click="removePostUp(index)"
                    >
                        删除
                    </button>
                </div>
                <button
                    class="w-full px-4 py-2 bg-white border border-dashed border-gray-300 rounded-md cursor-pointer text-sm font-semibold transition-colors text-gray-600 mt-1 hover:border-black hover:text-black"
                    @click="addPostUp"
                >
                    + 添加 PostUp 规则
                </button>
            </div>

            <h3 class="text-base font-semibold my-4 text-gray-600">PostDown 规则</h3>
            <div class="mb-5">
                <div class="flex gap-2 mb-2.5 items-center" v-for="(_, index) in config.postDown" :key="'down' + index">
                    <input
                        type="text"
                        v-model="config.postDown[index]"
                        class="flex-1 p-2.5 border border-gray-300 rounded-md box-border text-sm font-mono transition-colors focus:outline-none focus:border-black"
                    />
                    <button
                        class="px-3 py-1.5 text-red-600 border border-red-200 bg-white rounded-md cursor-pointer text-xs font-semibold transition-colors hover:bg-red-600 hover:text-white hover:border-red-600"
                        @click="removePostDown(index)"
                    >
                        删除
                    </button>
                </div>
                <button
                    class="w-full px-4 py-2 bg-white border border-dashed border-gray-300 rounded-md cursor-pointer text-sm font-semibold transition-colors text-gray-600 mt-1 hover:border-black hover:text-black"
                    @click="addPostDown"
                >
                    + 添加 PostDown 规则
                </button>
            </div>

            <div class="mb-4 flex items-center justify-between gap-3 border-b border-gray-200 pb-2">
                <h2 class="mt-0 text-xl font-semibold">对等节点 (Peers)</h2>
                <button
                    class="shrink-0 rounded-md border border-sky-600 bg-sky-600 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:border-sky-700 hover:bg-sky-700"
                    type="button"
                    @click="regenerateAllPeerKeys"
                >
                    重新生成所有密钥
                </button>
            </div>
            <div
                class="relative mb-4 overflow-hidden rounded-lg border p-5 pr-17 shadow-sm transition-colors"
                :class="[
                    PEER_BACKGROUND_COLORS[index % PEER_BACKGROUND_COLORS.length] ?? 'bg-white',
                    hasPeerIssue(peer) ? 'border-red-400 ring-2 ring-red-200' : 'border-gray-200',
                    draggedPeerIndex === index ? 'opacity-60' : '',
                    draggedPeerIndex !== null && draggedPeerIndex !== index && dropTargetIndex === index
                        ? 'ring-2 ring-sky-300'
                        : '',
                ]"
                v-for="(peer, index) in config.peers"
                :key="peer.id"
                @dragover.prevent="onPeerDragOver(index, $event)"
                @drop="onPeerDrop(index, $event)"
            >
                <div
                    class="group -mx-5 -mt-5 mb-4 flex cursor-pointer items-center justify-between gap-3 border-b border-dashed border-gray-200 px-5 pb-2.5 pt-5 transition-colors hover:border-sky-300 hover:bg-sky-100"
                    role="button"
                    tabindex="0"
                    @click="peer.expanded = !peer.expanded"
                    @keydown.enter.prevent="peer.expanded = !peer.expanded"
                    @keydown.space.prevent="peer.expanded = !peer.expanded"
                >
                    <span class="flex min-w-0 items-center gap-1.5">
                        <span
                            class="shrink-0 cursor-grab rounded p-1 text-gray-400 transition-colors hover:bg-gray-200/70 hover:text-gray-600"
                            title="拖动调整节点顺序"
                            :draggable="true"
                            @dragstart="onPeerDragStart(index, $event)"
                            @dragend="onPeerDragEnd"
                            @click.stop
                        >
                            <svg viewBox="0 0 20 20" class="h-4 w-4" fill="currentColor" aria-hidden="true">
                                <circle cx="6.5" cy="4" r="1.2" />
                                <circle cx="13.5" cy="4" r="1.2" />
                                <circle cx="6.5" cy="10" r="1.2" />
                                <circle cx="13.5" cy="10" r="1.2" />
                                <circle cx="6.5" cy="16" r="1.2" />
                                <circle cx="13.5" cy="16" r="1.2" />
                            </svg>
                        </span>
                        <span
                            class="min-w-0 text-sm font-semibold text-gray-600 transition-colors group-hover:text-gray-800"
                        >
                            {{ getPeerDisplayName(peer, index) }}
                        </span>
                        <span
                            v-if="getPeerIssueLabel(peer)"
                            class="shrink-0 rounded bg-red-100 px-1.5 py-0.5 text-xs font-semibold text-red-600"
                            :title="getPeerIssueMessage(peer)"
                        >
                            {{ getPeerIssueLabel(peer) }}
                        </span>
                    </span>
                    <span class="flex shrink-0 items-center gap-1">
                        <button
                            class="shrink-0 rounded-md p-1 text-gray-400 transition-colors hover:text-gray-700"
                            type="button"
                            @click.stop="peer.expanded = !peer.expanded"
                            aria-label="切换节点展开状态"
                        >
                            <svg
                                v-if="peer.expanded"
                                viewBox="0 0 20 20"
                                class="h-4 w-4"
                                fill="none"
                                aria-hidden="true"
                            >
                                <path
                                    d="M5 12l5-5 5 5"
                                    stroke="currentColor"
                                    stroke-width="1.8"
                                    stroke-linecap="round"
                                    stroke-linejoin="round"
                                />
                            </svg>
                            <svg v-else viewBox="0 0 20 20" class="h-4 w-4" fill="none" aria-hidden="true">
                                <path
                                    d="M5 8l5 5 5-5"
                                    stroke="currentColor"
                                    stroke-width="1.8"
                                    stroke-linecap="round"
                                    stroke-linejoin="round"
                                />
                            </svg>
                        </button>
                    </span>
                </div>

                <div v-if="peer.expanded">
                    <div
                        v-if="getPeerIssueMessage(peer)"
                        class="mb-4 rounded-md border border-red-300 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700"
                    >
                        {{ getPeerIssueMessage(peer) }}
                    </div>
                    <div class="mb-4">
                        <label class="block text-sm font-semibold mb-1.5 text-gray-600">节点备注</label>
                        <input
                            type="text"
                            v-model="peer.name"
                            placeholder="例如: 手机 / 笔记本"
                            class="w-full p-2.5 border border-gray-300 rounded-md box-border text-sm font-mono transition-colors focus:outline-none focus:border-black"
                        />
                    </div>
                    <div class="mb-4">
                        <label class="block text-sm font-semibold mb-1.5 text-gray-600">PrivateKey (私钥)</label>
                        <div class="relative">
                            <input
                                :type="peer.showPrivateKey ? 'text' : 'password'"
                                v-model="peer.privateKey"
                                @input="derivePeerPublicKey(peer)"
                                class="w-full p-2.5 pr-16 border border-gray-300 rounded-md box-border text-sm font-mono transition-colors focus:outline-none focus:border-black"
                            />
                            <button
                                class="absolute right-10 top-1/2 -translate-y-1/2 rounded-md p-1 text-gray-400 transition-colors hover:text-gray-700"
                                type="button"
                                :aria-label="peer.showPrivateKey ? '隐藏私钥' : '显示私钥'"
                                :title="peer.showPrivateKey ? '隐藏私钥' : '显示私钥'"
                                @click="peer.showPrivateKey = !peer.showPrivateKey"
                            >
                                <svg
                                    v-if="peer.showPrivateKey"
                                    viewBox="0 0 20 20"
                                    class="h-4 w-4"
                                    fill="none"
                                    aria-hidden="true"
                                >
                                    <path
                                        d="M2.5 10s2.7-5.5 7.5-5.5S17.5 10 17.5 10s-2.7 5.5-7.5 5.5S2.5 10 2.5 10Z"
                                        stroke="currentColor"
                                        stroke-width="1.6"
                                    />
                                    <circle cx="10" cy="10" r="2.2" stroke="currentColor" stroke-width="1.6" />
                                </svg>
                                <svg v-else viewBox="0 0 20 20" class="h-4 w-4" fill="none" aria-hidden="true">
                                    <path
                                        d="M3.5 4.5l13 11"
                                        stroke="currentColor"
                                        stroke-width="1.6"
                                        stroke-linecap="round"
                                    />
                                    <path
                                        d="M4.5 10s2.5-5 5.5-5c1.1 0 2.1.4 3 .9"
                                        stroke="currentColor"
                                        stroke-width="1.6"
                                        stroke-linecap="round"
                                        stroke-linejoin="round"
                                    />
                                    <path
                                        d="M15.5 10s-2.5 5-5.5 5c-1.1 0-2.1-.4-3-.9"
                                        stroke="currentColor"
                                        stroke-width="1.6"
                                        stroke-linecap="round"
                                        stroke-linejoin="round"
                                    />
                                </svg>
                            </button>
                            <button
                                class="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-gray-400 transition-colors hover:text-gray-700"
                                type="button"
                                title="重新生成密钥对"
                                aria-label="重新生成密钥对"
                                @click="generatePeerKeys(peer)"
                            >
                                <svg viewBox="0 0 20 20" class="h-4 w-4" fill="none" aria-hidden="true">
                                    <path
                                        d="M16 10a6 6 0 1 1-1.4-3.8"
                                        stroke="currentColor"
                                        stroke-width="1.6"
                                        stroke-linecap="round"
                                    />
                                    <path
                                        d="M15.5 3.5v3.5H12"
                                        stroke="currentColor"
                                        stroke-width="1.6"
                                        stroke-linecap="round"
                                        stroke-linejoin="round"
                                    />
                                </svg>
                            </button>
                        </div>
                    </div>
                    <div class="mb-4">
                        <label class="block text-sm font-semibold mb-1.5 text-gray-600">PublicKey (节点公钥)</label>
                        <div class="flex items-center gap-2">
                            <input
                                type="text"
                                v-model="peer.publicKey"
                                readonly
                                class="min-w-0 flex-1 p-2.5 border border-gray-300 rounded-md box-border text-sm font-mono transition-colors focus:outline-none bg-gray-100 text-gray-500 cursor-not-allowed"
                            />
                            <button
                                class="shrink-0 rounded-md border border-sky-600 bg-sky-600 px-3 py-2 text-xs font-semibold text-white transition-colors hover:border-sky-700 hover:bg-sky-700"
                                type="button"
                                @click="copyPeerPublicKey(peer)"
                            >
                                复制
                            </button>
                        </div>
                    </div>
                    <div class="mb-4">
                        <label class="block text-sm font-semibold mb-1.5 text-gray-600">主机号</label>
                        <input
                            type="number"
                            min="1"
                            step="1"
                            v-model.number="peer.hostPart"
                            placeholder="例如: 101"
                            class="w-full p-2.5 border border-gray-300 rounded-md box-border text-sm font-mono transition-colors focus:outline-none focus:border-black"
                        />
                    </div>
                </div>

                <div class="mt-4 flex justify-end gap-2">
                    <button
                        class="px-3 py-1.5 text-gray-700 border border-gray-300 bg-white rounded-md cursor-pointer text-xs font-semibold transition-colors hover:bg-gray-800 hover:text-white hover:border-gray-800 disabled:cursor-not-allowed disabled:border-gray-200 disabled:bg-gray-50 disabled:text-gray-300 disabled:hover:border-gray-200 disabled:hover:bg-gray-50 disabled:hover:text-gray-300"
                        type="button"
                        :disabled="hasPeerIssue(peer)"
                        :title="
                            hasPeerIssue(peer)
                                ? '该节点配置有误，请先修正'
                                : '复制该节点的 [Peer] 配置，粘贴到中继服务器的 wg0.conf'
                        "
                        @click="copyRelayPeerBlock(peer)"
                    >
                        复制中继配置
                    </button>
                    <button
                        class="px-3 py-1.5 text-sky-700 border border-sky-200 bg-white rounded-md cursor-pointer text-xs font-semibold transition-colors hover:bg-sky-700 hover:text-white hover:border-sky-700 disabled:cursor-not-allowed disabled:border-gray-200 disabled:text-gray-300 disabled:hover:border-gray-200 disabled:hover:bg-white disabled:hover:text-gray-300"
                        type="button"
                        :disabled="hasPeerIssue(peer)"
                        :title="hasPeerIssue(peer) ? '该节点配置有误，请先修正' : '复制该节点的客户端配置'"
                        @click="copyClientConfig(peer)"
                    >
                        复制客户端配置
                    </button>
                    <button
                        class="px-3 py-1.5 text-red-600 border border-red-200 bg-white rounded-md cursor-pointer text-xs font-semibold transition-colors hover:bg-red-600 hover:text-white hover:border-red-600"
                        type="button"
                        @click="removePeer(index)"
                    >
                        删除此节点
                    </button>
                </div>
                <div
                    class="absolute inset-y-0 right-0 flex w-12 flex-col border-l border-gray-200 bg-gray-200/40"
                    role="group"
                    aria-label="调整节点顺序"
                >
                    <span
                        class="flex w-full items-center justify-center text-xs font-semibold leading-none text-gray-500"
                        style="flex: 1 1 0%"
                        aria-label="节点序号"
                    >
                        {{ index + 1 }}
                    </span>
                    <button
                        type="button"
                        class="flex w-full cursor-pointer items-center justify-center text-gray-400 transition-colors hover:bg-gray-300/60 hover:text-gray-600 disabled:cursor-not-allowed disabled:text-gray-300 disabled:hover:bg-transparent disabled:hover:text-gray-300"
                        style="flex: 2 2 0%"
                        :disabled="index === 0"
                        :aria-label="`上移节点 ${peer.name.trim() || index + 1}`"
                        title="上移"
                        @click.stop="movePeer(index, index - 1)"
                        @keydown.enter.stop
                        @keydown.space.stop
                    >
                        <svg viewBox="0 0 20 20" class="h-4 w-4" fill="none" aria-hidden="true">
                            <path
                                d="M5 12l5-5 5 5"
                                stroke="currentColor"
                                stroke-width="1.8"
                                stroke-linecap="round"
                                stroke-linejoin="round"
                            />
                        </svg>
                    </button>
                    <button
                        type="button"
                        class="flex w-full cursor-pointer items-center justify-center text-gray-400 transition-colors hover:bg-gray-300/60 hover:text-gray-600 disabled:cursor-not-allowed disabled:text-gray-300 disabled:hover:bg-transparent disabled:hover:text-gray-300"
                        style="flex: 2 2 0%"
                        :disabled="index === config.peers.length - 1"
                        :aria-label="`下移节点 ${peer.name.trim() || index + 1}`"
                        title="下移"
                        @click.stop="movePeer(index, index + 1)"
                        @keydown.enter.stop
                        @keydown.space.stop
                    >
                        <svg viewBox="0 0 20 20" class="h-4 w-4" fill="none" aria-hidden="true">
                            <path
                                d="M5 8l5 5 5-5"
                                stroke="currentColor"
                                stroke-width="1.8"
                                stroke-linecap="round"
                                stroke-linejoin="round"
                            />
                        </svg>
                    </button>
                </div>
            </div>

            <button
                class="w-full p-3 bg-white border border-dashed border-gray-300 rounded-md cursor-pointer text-sm font-semibold transition-colors text-gray-600 mt-1 hover:border-black hover:text-black"
                @click="addPeer"
            >
                + 添加新节点
            </button>
            <div class="h-12"></div>
        </div>

        <div class="w-1/2 p-8 bg-gray-50 overflow-y-auto box-border flex flex-col min-h-0">
            <div class="mb-4 flex items-center justify-between gap-3 border-b border-gray-200 pb-2">
                <h2 class="mt-0 text-xl font-semibold">wg.conf 预览</h2>
                <button
                    class="shrink-0 rounded-md border border-sky-600 bg-sky-600 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:border-sky-700 hover:bg-sky-700 disabled:cursor-not-allowed disabled:border-gray-300 disabled:bg-gray-300 disabled:hover:border-gray-300 disabled:hover:bg-gray-300"
                    :disabled="hasConfigError"
                    :title="hasConfigError ? '配置有误，请先修正标红的项' : '复制 wg0.conf'"
                    @click="copyGeneratedConfig"
                >
                    复制
                </button>
            </div>
            <pre
                class="bg-white p-5 rounded-lg border border-gray-200 font-mono text-sm leading-relaxed overflow-x-auto grow whitespace-pre-wrap wrap-break-word shadow-inner"
                >{{ generatedConfig }}</pre>
            <div class="mt-4 flex justify-end">
                <button
                    class="rounded-md border border-sky-600 bg-sky-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:border-sky-700 hover:bg-sky-700 disabled:cursor-not-allowed disabled:border-gray-300 disabled:bg-gray-300 disabled:hover:border-gray-300 disabled:hover:bg-gray-300"
                    type="button"
                    :disabled="hasConfigError"
                    :title="hasConfigError ? '配置有误，请先修正标红的项' : '下载配置包 (wg0.conf + 各节点客户端配置)'"
                    @click="downloadConfigPackage"
                >
                    下载配置包
                </button>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from "vue";
import JSZip from "jszip";
import nacl from "tweetnacl";

interface Peer {
    id: number;
    name: string;
    privateKey: string;
    publicKey: string;
    hostPart: number | null;
    expanded: boolean;
    showPrivateKey: boolean;
}

interface WgConfig {
    host: string;
    port: number | null;
    mtu: number | null;
    relayServer: string;
    privateKey: string;
    publicKey: string;
    postUp: string[];
    postDown: string[];
    peers: Peer[];
}

interface PeerIssue {
    missingHostPart: boolean;
    invalidHostPart: number | null;
    duplicateHostPart: number | null;
    invalidKey: boolean;
    duplicateKey: boolean;
}

interface IniSection {
    name: string;
    pairs: Record<string, string[]>;
    comments: string[];
}

const PEER_BACKGROUND_COLORS = ["bg-white", "bg-gray-100"] as const;

const STORAGE_KEY = "hm-tools.wireguard-config-generator";

// /24 网段里可用的主机地址范围（.0 是网络号，.255 是广播地址）。
const MIN_HOST_PART = 1;
const MAX_HOST_PART = 254;
const MIN_PORT = 1;
const MAX_PORT = 65535;
// 下限 1280 兼顾两件事：WireGuard 对 IPv6 的最低要求，以及客户端配置里写死的 1280，
// 保证中继 MTU 不会低于客户端。
const MIN_MTU = 1280;
const MAX_MTU = 1500;

const createDefaultConfig = (): WgConfig => ({
    host: "10.8.0.1",
    port: 51820,
    mtu: 1420,
    relayServer: "",
    privateKey: "",
    publicKey: "",
    postUp: [
        "iptables -A FORWARD -i %i -j ACCEPT;",
        "iptables -A FORWARD -o %i -j ACCEPT;",
        "iptables -t nat -A POSTROUTING -o eth0 -j MASQUERADE",
    ],
    postDown: [
        "iptables -D FORWARD -i %i -j ACCEPT;",
        "iptables -D FORWARD -o %i -j ACCEPT;",
        "iptables -t nat -D POSTROUTING -o eth0 -j MASQUERADE",
    ],
    peers: [],
});

const encodeBase64 = (arr: Uint8Array): string => btoa(String.fromCharCode(...arr));
const decodeBase64 = (str: string): Uint8Array | null => {
    try {
        const bin = atob(str);
        const arr = new Uint8Array(bin.length);
        for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
        return arr;
    } catch (e) {
        console.error(e);
        return null;
    }
};

const config = reactive<WgConfig>(createDefaultConfig());
const showInterfacePrivateKey = ref(false);
const draggedPeerIndex = ref<number | null>(null);
const dropTargetIndex = ref<number | null>(null);
const importFileInputRef = ref<HTMLInputElement | null>(null);

let peerIdCounter = 0;

const saveConfig = () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
};

const normalizeSavedConfig = (savedConfig: Partial<WgConfig>): WgConfig => {
    const merged = { ...createDefaultConfig(), ...savedConfig };

    if (typeof merged.host === "string" && merged.host.endsWith("/24")) {
        merged.host = merged.host.slice(0, -3);
    }

    const savedPeers = Array.isArray(savedConfig.peers) ? savedConfig.peers : [];
    merged.peers = savedPeers.map((peer, index) => ({
        id: typeof peer.id === "number" ? peer.id : index,
        name: typeof peer.name === "string" ? peer.name : "",
        privateKey: typeof peer.privateKey === "string" ? peer.privateKey : "",
        publicKey: typeof peer.publicKey === "string" ? peer.publicKey : "",
        hostPart: typeof peer.hostPart === "number" && Number.isFinite(peer.hostPart) ? peer.hostPart : null,
        expanded: typeof peer.expanded === "boolean" ? peer.expanded : true,
        showPrivateKey: typeof peer.showPrivateKey === "boolean" ? peer.showPrivateKey : false,
    }));

    peerIdCounter = merged.peers.reduce((maxId, peer) => Math.max(maxId, peer.id + 1), 0);
    merged.peers.forEach((peer) => ensurePeerKeyPair(peer));

    return merged;
};

const loadConfig = () => {
    const rawConfig = localStorage.getItem(STORAGE_KEY);
    if (!rawConfig) return;

    try {
        const savedConfig = JSON.parse(rawConfig) as Partial<WgConfig>;
        Object.assign(config, normalizeSavedConfig(savedConfig));
    } catch (error) {
        console.error(error);
    }
};

const generateKeys = () => {
    const secretKey = nacl.randomBytes(32);
    secretKey[0]! &= 248;
    secretKey[31]! &= 127;
    secretKey[31]! |= 64;
    const publicKey = nacl.scalarMult.base(secretKey);
    config.privateKey = encodeBase64(secretKey);
    config.publicKey = encodeBase64(publicKey);
};

const derivePublicKey = () => {
    if (!config.privateKey) {
        config.publicKey = "";
        return;
    }
    const secretKey = decodeBase64(config.privateKey);
    if (secretKey && secretKey.length === 32) {
        try {
            const publicKey = nacl.scalarMult.base(secretKey);
            config.publicKey = encodeBase64(publicKey);
        } catch (e) {
            console.error(e);
            config.publicKey = "(无效的私钥格式)";
        }
    } else {
        config.publicKey = "(密钥长度或格式不正确)";
    }
};

const generatePeerKeys = (peer: Peer) => {
    const secretKey = nacl.randomBytes(32);
    secretKey[0]! &= 248;
    secretKey[31]! &= 127;
    secretKey[31]! |= 64;
    const publicKey = nacl.scalarMult.base(secretKey);
    peer.privateKey = encodeBase64(secretKey);
    peer.publicKey = encodeBase64(publicKey);
};

const derivePeerPublicKey = (peer: Peer) => {
    if (!peer.privateKey.trim()) {
        generatePeerKeys(peer);
        return;
    }

    const secretKey = decodeBase64(peer.privateKey);
    if (secretKey && secretKey.length === 32) {
        try {
            peer.publicKey = encodeBase64(nacl.scalarMult.base(secretKey));
        } catch (error) {
            console.error(error);
            peer.publicKey = "(无效的私钥格式)";
        }
    } else {
        peer.publicKey = "(密钥长度或格式不正确)";
    }
};

const ensurePeerKeyPair = (peer: Peer) => {
    if (!peer.privateKey.trim()) {
        generatePeerKeys(peer);
        return;
    }

    derivePeerPublicKey(peer);
};

const addPostUp = () => config.postUp.push("");
const removePostUp = (index: number) => config.postUp.splice(index, 1);
const addPostDown = () => config.postDown.push("");
const removePostDown = (index: number) => config.postDown.splice(index, 1);

const addPeer = () => {
    const peer: Peer = {
        id: peerIdCounter++,
        name: "",
        privateKey: "",
        publicKey: "",
        hostPart: null,
        expanded: true,
        showPrivateKey: false,
    };
    generatePeerKeys(peer);
    config.peers.push(peer);
};
const removePeer = (index: number) => config.peers.splice(index, 1);

const movePeer = (from: number, to: number) => {
    const peerCount = config.peers.length;
    const target = Math.max(0, Math.min(peerCount - 1, to));
    if (peerCount < 2 || from === target) return;

    const [movedPeer] = config.peers.splice(from, 1);
    if (movedPeer) {
        config.peers.splice(target, 0, movedPeer);
    }
};

const getPeerDisplayName = (peer: Peer, index: number): string => {
    const label = peer.name.trim() || `节点 #${index + 1}`;
    const hostPart = getNumericValue(peer.hostPart);

    return hostPart === null ? label : `${label} (${hostPart})`;
};

// 数字输入框被清空时 v-model.number 留下的是空字符串，而类型标注写的是 number | null，
// 所以运行时取值一律走这里，不要直接相信 config.port / peer.hostPart 的类型。
const getNumericValue = (value: number | null): number | null =>
    typeof value === "number" && Number.isFinite(value) ? value : null;

const isValidHostPart = (hostPart: number): boolean =>
    Number.isInteger(hostPart) && hostPart >= MIN_HOST_PART && hostPart <= MAX_HOST_PART;

// 只有合法主机号才算数，缺失和越界都按“没有”处理，生成配置时不会用到。
const getHostPart = (peer: Peer): number | null => {
    const hostPart = getNumericValue(peer.hostPart);
    return hostPart !== null && isValidHostPart(hostPart) ? hostPart : null;
};

// 私钥非法时 publicKey 会被写成 "(无效的私钥格式)" 这类提示文案，
// 这些字符串同样会互相重复，需要排除掉，否则会产生误报。
const isValidWireGuardKey = (key: string): boolean => {
    const decoded = decodeBase64(key.trim());
    return decoded !== null && decoded.length === 32;
};

const parseIpv4Octets = (value: string): number[] | null => {
    const parts = value.trim().split(".");
    if (parts.length !== 4 || parts.some((part) => !/^\d{1,3}$/.test(part))) return null;

    const octets = parts.map(Number);
    return octets.every((octet) => octet <= 255) ? octets : null;
};

const getRelayServerIssue = (): string => (config.relayServer.trim() ? "" : "未填写域名/IP");

const getHostIssue = (): string => {
    const hostBase = getHostBase(config.host);
    if (!hostBase) return "未填写 Address (主机 IP)";

    const octets = parseIpv4Octets(hostBase);
    if (!octets) return "Address (主机 IP) 不是合法的 IPv4 地址";

    const lastOctet = octets[3]!;
    if (lastOctet < MIN_HOST_PART || lastOctet > MAX_HOST_PART) {
        return `Address (主机 IP) 的最后一段必须在 ${MIN_HOST_PART}-${MAX_HOST_PART} 之间`;
    }

    return "";
};

const isValidPort = (port: number): boolean => Number.isInteger(port) && port >= MIN_PORT && port <= MAX_PORT;

// 同 getHostPart：只有合法端口才算数，客户端配置的 Endpoint 用它拼出来。
const getPort = (): number | null => {
    const port = getNumericValue(config.port);
    return port !== null && isValidPort(port) ? port : null;
};

const getPortIssue = (): string => {
    const port = getNumericValue(config.port);
    if (port === null) return "未填写 ListenPort (监听端口)";

    return isValidPort(port) ? "" : `ListenPort (监听端口) 必须是 ${MIN_PORT}-${MAX_PORT} 之间的整数`;
};

const getMtuIssue = (): string => {
    const mtu = getNumericValue(config.mtu);
    if (mtu === null) return "未填写 MTU";

    return Number.isInteger(mtu) && mtu >= MIN_MTU && mtu <= MAX_MTU
        ? ""
        : `MTU 必须是 ${MIN_MTU}-${MAX_MTU} 之间的整数`;
};

const getInterfaceKeyIssue = (): string => {
    const privateKey = config.privateKey.trim();
    if (!privateKey) return "未填写 PrivateKey (私钥)";

    return isValidWireGuardKey(privateKey) ? "" : "PrivateKey (私钥) 不是有效的 WireGuard 密钥";
};

// 节点的空私钥会被 ensurePeerKeyPair 自动补齐新密钥对，所以不算错误；
// 只有填了内容却解不出 32 字节才报错。
const hasInvalidPeerKey = (peer: Peer): boolean => {
    const privateKey = peer.privateKey.trim();
    return privateKey !== "" && !isValidWireGuardKey(privateKey);
};

const peerIssues = computed((): Map<number, PeerIssue> => {
    const issues = new Map<number, PeerIssue>();
    const peersByHostPart = new Map<number, Peer[]>();
    const peersByPublicKey = new Map<string, Peer[]>();

    const addToGroup = <K,>(groups: Map<K, Peer[]>, key: K, peer: Peer) => {
        const group = groups.get(key);
        if (group) {
            group.push(peer);
        } else {
            groups.set(key, [peer]);
        }
    };

    const getOrCreateIssue = (peer: Peer): PeerIssue => {
        const existing = issues.get(peer.id);
        if (existing) return existing;

        const created: PeerIssue = {
            missingHostPart: false,
            invalidHostPart: null,
            duplicateHostPart: null,
            invalidKey: false,
            duplicateKey: false,
        };
        issues.set(peer.id, created);
        return created;
    };

    config.peers.forEach((peer) => {
        const hostPart = getNumericValue(peer.hostPart);
        if (hostPart === null) {
            getOrCreateIssue(peer).missingHostPart = true;
        } else if (!isValidHostPart(hostPart)) {
            // 越界的主机号不参与重复比较，否则同一个错误会报两遍。
            getOrCreateIssue(peer).invalidHostPart = hostPart;
        } else {
            addToGroup(peersByHostPart, hostPart, peer);
        }

        if (hasInvalidPeerKey(peer)) {
            getOrCreateIssue(peer).invalidKey = true;
        }

        const publicKey = peer.publicKey.trim();
        if (isValidWireGuardKey(publicKey)) {
            addToGroup(peersByPublicKey, publicKey, peer);
        }
    });

    peersByHostPart.forEach((group, hostPart) => {
        if (group.length < 2) return;
        group.forEach((peer) => {
            getOrCreateIssue(peer).duplicateHostPart = hostPart;
        });
    });

    peersByPublicKey.forEach((group) => {
        if (group.length < 2) return;
        group.forEach((peer) => {
            getOrCreateIssue(peer).duplicateKey = true;
        });
    });

    return issues;
});

const hasPeerIssue = (peer: Peer): boolean => peerIssues.value.has(peer.id);

// 返回空字符串表示该节点没有问题，模板里直接当作 v-if 条件用。
const getPeerIssueMessage = (peer: Peer): string => {
    const issue = peerIssues.value.get(peer.id);
    if (!issue) return "";

    const reasons: string[] = [];

    if (issue.missingHostPart) {
        reasons.push("未填写主机号");
    }
    if (issue.invalidHostPart !== null) {
        reasons.push(`主机号 ${issue.invalidHostPart} 无效，必须是 ${MIN_HOST_PART}-${MAX_HOST_PART} 之间的整数`);
    }
    if (issue.duplicateHostPart !== null) {
        reasons.push(`主机号 ${issue.duplicateHostPart} 已被其它节点占用`);
    }
    if (issue.invalidKey) {
        reasons.push("密钥格式不正确");
    }
    if (issue.duplicateKey) {
        reasons.push("密钥与其它节点重复");
    }

    return `${reasons.join("；")}，请修改。`;
};

// 折叠状态下的短标签。主机号是必填项，新增节点默认就是空的，
// 所以「未填主机号」比笼统的「冲突」更值得直接写出来。
const getPeerIssueLabel = (peer: Peer): string => {
    const issue = peerIssues.value.get(peer.id);
    if (!issue) return "";

    if (issue.missingHostPart) return "未填主机号";
    if (issue.invalidHostPart !== null) return "主机号有误";

    return "冲突";
};

const configIssues = computed((): string[] =>
    [getRelayServerIssue(), getHostIssue(), getPortIssue(), getMtuIssue(), getInterfaceKeyIssue()].filter(
        (issue) => issue !== "",
    ),
);

// 复制和下载产出的都是拿去直接使用的配置，只要有一处错误就整体禁用。
const hasConfigError = computed((): boolean => configIssues.value.length > 0 || peerIssues.value.size > 0);

const onPeerDragStart = (index: number, event: DragEvent) => {
    draggedPeerIndex.value = index;
    dropTargetIndex.value = index;

    if (event.dataTransfer) {
        event.dataTransfer.effectAllowed = "move";
        event.dataTransfer.setData("text/plain", index.toString());
    }
};

const onPeerDragOver = (index: number, event: DragEvent) => {
    if (draggedPeerIndex.value === null) return;

    event.preventDefault();
    dropTargetIndex.value = index;
};

const onPeerDrop = (index: number, event: DragEvent) => {
    const from = draggedPeerIndex.value;
    if (from !== null) {
        event.preventDefault();
        movePeer(from, index);
    }

    draggedPeerIndex.value = null;
    dropTargetIndex.value = null;
};

const onPeerDragEnd = () => {
    draggedPeerIndex.value = null;
    dropTargetIndex.value = null;
};

const regenerateAllPeerKeys = () => {
    config.peers.forEach((peer) => {
        generatePeerKeys(peer);
    });
};

const resetConfig = () => {
    const defaultConfig = createDefaultConfig();
    Object.assign(config, defaultConfig);
    peerIdCounter = 0;
    generateKeys();
    saveConfig();
};

const copyGeneratedConfig = async () => {
    await navigator.clipboard.writeText(generatedConfig.value);
};

const copyPublicKey = async () => {
    if (!config.publicKey.trim()) return;
    await navigator.clipboard.writeText(config.publicKey);
};

const copyPeerPublicKey = async (peer: Peer) => {
    ensurePeerKeyPair(peer);
    if (!peer.publicKey.trim()) return;
    await navigator.clipboard.writeText(peer.publicKey);
};

const sanitizePeerFileStem = (value: string, fallback: string): string => {
    const cleaned = value
        .trim()
        .replace(/\s+/g, "_")
        .replace(/[^A-Za-z0-9_-]/g, "");
    return cleaned || fallback;
};

const sanitizeArchiveFileName = (value: string, fallback: string): string => {
    const cleaned = value
        .trim()
        .replace(/\s+/g, "_")
        .replace(/[^A-Za-z0-9_.-]/g, "");
    return cleaned || fallback;
};

const getUniqueFileStem = (baseName: string, usedNames: Set<string>): string => {
    let candidate = baseName;
    let suffix = 2;

    while (usedNames.has(candidate)) {
        candidate = `${baseName}_${suffix}`;
        suffix += 1;
    }

    usedNames.add(candidate);
    return candidate;
};

const downloadConfigPackage = async () => {
    const zip = new JSZip();
    const usedPeerNames = new Set<string>();
    const packageName = sanitizeArchiveFileName(config.relayServer.trim(), "wireguard-config");

    zip.file("wg0.conf", generatedConfig.value);

    config.peers.forEach((peer, index) => {
        const baseName = sanitizePeerFileStem(peer.name.trim(), `peer_${index + 1}`);
        const fileStem = getUniqueFileStem(baseName, usedPeerNames);
        zip.file(`peers/${fileStem}.conf`, buildClientConfig(peer));
    });

    const blob = await zip.generateAsync({ type: "blob" });
    const downloadUrl = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = downloadUrl;
    link.download = `${packageName}.zip`;
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(downloadUrl), 1000);
};

const getHostBase = (host: string): string => host.trim().replace(/\/24$/, "");

const getPeerNetworkPrefix = (host: string): string => {
    const hostParts = getHostBase(host)
        .split(".")
        .map((part) => part.trim())
        .filter(Boolean);

    if (hostParts.length >= 3) return hostParts.slice(0, 3).join(".");

    return "10.8.0";
};

const buildClientConfig = (peer: Peer): string => {
    ensurePeerKeyPair(peer);

    const peerNetworkPrefix = getPeerNetworkPrefix(getHostBase(config.host));
    const hostPart = getHostPart(peer);
    const port = getPort();
    const relayServer = config.relayServer.trim();
    // 端口必须跟中继的 ListenPort 一致，否则客户端连的是另一个端口。
    const relayEndpoint = relayServer && port !== null ? `${relayServer}:${port}` : "";

    return (
        [
            "[Interface]",
            `PrivateKey = ${peer.privateKey}`,
            // 主机号必填，缺失时不生成占位地址，让预览里直接看出缺了什么。
            ...(hostPart === null ? [] : [`Address = ${peerNetworkPrefix}.${hostPart}/24`]),
            "MTU = 1280",
            "",
            "[Peer]",
            `PublicKey = ${config.publicKey}`,
            `AllowedIPs = ${peerNetworkPrefix}.0/24`,
            // 域名或端口缺失时整行省略，不写出 `Endpoint = ` 这种半截配置。
            ...(relayEndpoint === "" ? [] : [`Endpoint = ${relayEndpoint}`]),
            "PersistentKeepalive = 25",
        ].join("\n") + "\n"
    );
};

const copyClientConfig = async (peer: Peer) => {
    await navigator.clipboard.writeText(buildClientConfig(peer));
};

const buildRelayPeerBlock = (peer: Peer): string => {
    const publicKey = peer.publicKey.trim();
    const hostPart = getHostPart(peer);

    // 主机号或公钥不合格时整块跳过，不生成半截配置；公钥非法时 peer.publicKey 里
    // 存的是 "(无效的私钥格式)" 这类提示文案，绝不能当成密钥写进配置。
    if (!isValidWireGuardKey(publicKey) || hostPart === null) return "";

    const peerNetworkPrefix = getPeerNetworkPrefix(getHostBase(config.host));
    const lines: string[] = [];

    if (peer.name.trim()) lines.push(`# ${peer.name.trim()}`);
    lines.push(`PublicKey = ${publicKey}`);
    lines.push(`AllowedIPs = ${peerNetworkPrefix}.${hostPart}/32`);

    return `[Peer]\n${lines.join("\n")}`;
};

const copyRelayPeerBlock = async (peer: Peer) => {
    ensurePeerKeyPair(peer);
    const peerBlock = buildRelayPeerBlock(peer);
    if (!peerBlock) return;
    await navigator.clipboard.writeText(peerBlock);
};

const parseIniText = (text: string): IniSection[] => {
    const sections: IniSection[] = [];
    let current: IniSection | null = null;

    for (const rawLine of text.split(/\r?\n/)) {
        const line = rawLine.trim();
        if (!line) continue;

        const sectionMatch = line.match(/^\[([^\]]+)\]$/);
        if (sectionMatch) {
            current = { name: sectionMatch[1]!.trim(), pairs: {}, comments: [] };
            sections.push(current);
            continue;
        }

        if (!current) continue;

        if (line.startsWith("#")) {
            current.comments.push(line.slice(1).trim());
            continue;
        }

        const eqIndex = line.indexOf("=");
        if (eqIndex === -1) continue;

        const key = line.slice(0, eqIndex).trim();
        const value = line.slice(eqIndex + 1).trim();
        if (!current.pairs[key]) current.pairs[key] = [];
        current.pairs[key]!.push(value);
    }

    return sections;
};

const parseOptionalInt = (value: string | undefined): number | null => {
    if (!value) return null;
    const parsed = Number(value);
    return Number.isInteger(parsed) ? parsed : null;
};

const getLastIpOctet = (address: string): number | null => {
    const parts = address.trim().split("/")[0]!.split(".");
    const last = parts[parts.length - 1];
    if (!last) return null;

    const parsed = Number(last);
    return Number.isInteger(parsed) && parsed >= 0 && parsed <= 255 ? parsed : null;
};

const parseImportedConfigZip = async (zip: JSZip): Promise<Partial<WgConfig> | null> => {
    const wg0File = zip.file("wg0.conf");
    if (!wg0File) return null;

    const sections = parseIniText(await wg0File.async("string"));
    const interfaceSection = sections.find((section) => section.name === "Interface");
    const peerSections = sections.filter((section) => section.name === "Peer");
    const imported: Partial<WgConfig> = {};

    if (interfaceSection) {
        const pairs = interfaceSection.pairs;
        const address = pairs.Address?.[0] ?? "";

        if (address) imported.host = getHostBase(address);
        imported.port = parseOptionalInt(pairs.ListenPort?.[0]);
        imported.mtu = parseOptionalInt(pairs.MTU?.[0]);
        imported.privateKey = pairs.PrivateKey?.[0] ?? "";
        imported.postUp = pairs.PostUp ?? [];
        imported.postDown = pairs.PostDown ?? [];
        imported.relayServer = interfaceSection.comments.find((comment) => !comment.startsWith("PublicKey =")) ?? "";
    }

    const wgPeerInfos = peerSections.map((section) => ({
        name: section.comments.find((comment) => !comment.startsWith("PublicKey =")) ?? "",
        publicKey: section.pairs.PublicKey?.[0] ?? "",
        hostPart: getLastIpOctet(section.pairs.AllowedIPs?.[0] ?? ""),
    }));

    const clientsByPublicKey = new Map<string, Peer>();
    const clientFiles = zip.file(/^peers\/.+\.conf$/i);
    for (const clientFile of clientFiles) {
        const clientSections = parseIniText(await clientFile.async("string"));
        const clientInterface = clientSections.find((section) => section.name === "Interface");
        if (!clientInterface) continue;

        const privateKey = clientInterface.pairs.PrivateKey?.[0] ?? "";
        if (!privateKey.trim()) continue;

        const clientPeer: Peer = {
            id: 0,
            name: "",
            privateKey,
            publicKey: "",
            hostPart: getLastIpOctet(clientInterface.pairs.Address?.[0] ?? ""),
            expanded: true,
            showPrivateKey: false,
        };
        ensurePeerKeyPair(clientPeer);
        clientsByPublicKey.set(clientPeer.publicKey, clientPeer);
    }

    let importedPeers: Peer[] = wgPeerInfos.map((wgPeerInfo, index) => {
        const clientPeer = wgPeerInfo.publicKey ? clientsByPublicKey.get(wgPeerInfo.publicKey) : undefined;

        return {
            id: index,
            name: wgPeerInfo.name,
            privateKey: clientPeer?.privateKey ?? "",
            publicKey: wgPeerInfo.publicKey || clientPeer?.publicKey || "",
            hostPart: wgPeerInfo.hostPart ?? clientPeer?.hostPart ?? null,
            expanded: true,
            showPrivateKey: false,
        };
    });

    if (importedPeers.length === 0) {
        importedPeers = [...clientsByPublicKey.values()].map((clientPeer, index) => ({
            id: index,
            name: "",
            privateKey: clientPeer.privateKey,
            publicKey: clientPeer.publicKey,
            hostPart: clientPeer.hostPart,
            expanded: true,
            showPrivateKey: false,
        }));
    }

    imported.peers = importedPeers;
    return imported;
};

const openImportFilePicker = () => {
    importFileInputRef.value?.click();
};

const handleImportFile = async (event: Event) => {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = "";
    if (!file) return;

    try {
        const zip = await JSZip.loadAsync(file);
        const importedConfig = await parseImportedConfigZip(zip);
        if (!importedConfig) {
            alert("导入失败：压缩包中未找到 wg0.conf，无法识别为配置包。");
            return;
        }

        const normalized = normalizeSavedConfig(importedConfig);
        Object.assign(config, normalized);
        config.peers.forEach((peer) => {
            peer.expanded = false;
        });

        if (!config.privateKey) {
            generateKeys();
        } else if (!config.publicKey) {
            derivePublicKey();
        }
        saveConfig();
    } catch (error) {
        console.error(error);
        alert("导入失败：文件不是有效的配置包或已损坏。");
    }
};

const generatedConfig = computed(() => {
    let conf = `[Interface]\n`;
    const hostBase = getHostBase(config.host);
    const peerNetworkPrefix = getPeerNetworkPrefix(hostBase);

    if (config.relayServer.trim()) conf += `# ${config.relayServer.trim()}\n`;
    if (config.publicKey.trim()) conf += `# PublicKey = ${config.publicKey.trim()}\n`;
    if (config.privateKey) conf += `PrivateKey = ${config.privateKey}\n`;
    if (hostBase) conf += `Address = ${hostBase}/24\n`;
    if (config.port) conf += `ListenPort = ${config.port}\n`;
    if (config.mtu) conf += `MTU = ${config.mtu}\n`;

    config.postUp.forEach((rule) => {
        if (rule.trim()) conf += `PostUp = ${rule.trim()}\n`;
    });
    config.postDown.forEach((rule) => {
        if (rule.trim()) conf += `PostDown = ${rule.trim()}\n`;
    });

    config.peers.forEach((peer) => {
        const peerBlock = buildRelayPeerBlock(peer);
        if (peerBlock) conf += `\n${peerBlock}\n`;
    });
    return conf;
});

onMounted(() => {
    loadConfig();

    if (!config.privateKey) {
        generateKeys();
    } else if (!config.publicKey) {
        derivePublicKey();
    }
});

watch(
    config,
    () => {
        saveConfig();
    },
    { deep: true },
);
</script>
