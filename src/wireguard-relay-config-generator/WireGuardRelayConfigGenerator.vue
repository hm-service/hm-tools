<template>
    <div class="flex h-full w-full min-h-0 text-gray-800 font-sans box-border">
        <div class="w-1/2 min-h-0 overflow-y-auto border-r border-gray-200 box-border p-4">
            <div class="mb-3 flex items-center justify-between gap-2 border-b border-gray-200 pb-2">
                <h2 class="text-base font-semibold">WireGuard 接口配置 (Interface)</h2>
                <div class="flex shrink-0 items-center gap-1.5">
                    <button
                        type="button"
                        class="h-8 shrink-0 cursor-pointer rounded border border-gray-300 bg-white px-2.5 text-sm font-semibold text-gray-600 transition-colors hover:border-gray-500 hover:text-gray-900"
                        @click="openImportFilePicker"
                    >
                        导入
                    </button>
                    <button
                        type="button"
                        class="h-8 shrink-0 cursor-pointer rounded border border-sky-600 bg-sky-600 px-2.5 text-sm font-semibold text-white transition-colors hover:border-sky-700 hover:bg-sky-700"
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
                class="mb-3 rounded border border-red-300 bg-red-50 px-2.5 py-1.5 text-xs font-semibold text-red-700"
            >
                <div v-for="issue in configIssues" :key="issue">{{ issue }}</div>
            </div>

            <div class="space-y-3">
                <section class="rounded-lg border border-gray-200 bg-gray-50/70 p-3">
                    <h3 class="mb-2 text-sm font-semibold text-gray-700">网络配置</h3>
                    <div class="grid grid-cols-2 gap-x-3 gap-y-2.5">
                        <div>
                            <label class="mb-1 block text-xs font-semibold text-gray-500">Address (主机 IP)</label>
                            <div class="relative">
                                <input
                                    type="text"
                                    v-model="config.host"
                                    placeholder="例如: 10.8.0.1"
                                    class="h-9 w-full rounded-md border border-gray-300 box-border bg-white pl-2.5 pr-10 font-mono text-sm transition-colors focus:border-black focus:outline-none"
                                />
                                <span
                                    class="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-xs font-semibold text-gray-400"
                                >
                                    /24
                                </span>
                            </div>
                        </div>

                        <div>
                            <label class="mb-1 block text-xs font-semibold text-gray-500">ListenPort (监听端口)</label>
                            <input
                                type="number"
                                v-model.number="config.port"
                                class="h-9 w-full rounded-md border border-gray-300 box-border bg-white px-2.5 font-mono text-sm transition-colors focus:border-black focus:outline-none"
                            />
                        </div>

                        <div>
                            <label class="mb-1 block text-xs font-semibold text-gray-500">
                                域名/IP (客户端 Endpoint)
                            </label>
                            <input
                                type="text"
                                v-model="config.relayServer"
                                placeholder="例如: relay.example.com"
                                class="h-9 w-full rounded-md border border-gray-300 box-border bg-white px-2.5 font-mono text-sm transition-colors focus:border-black focus:outline-none"
                            />
                        </div>

                        <div>
                            <label class="mb-1 block text-xs font-semibold text-gray-500">MTU</label>
                            <input
                                type="number"
                                v-model.number="config.mtu"
                                class="h-9 w-full rounded-md border border-gray-300 box-border bg-white px-2.5 font-mono text-sm transition-colors focus:border-black focus:outline-none"
                            />
                        </div>
                    </div>
                </section>

                <section class="rounded-lg border border-gray-200 bg-gray-50/70 p-3">
                    <h3 class="mb-2 text-sm font-semibold text-gray-700">密钥配置</h3>
                    <div class="space-y-2.5">
                        <div>
                            <label class="mb-1 block text-xs font-semibold text-gray-500">PrivateKey (私钥)</label>
                            <div class="relative">
                                <input
                                    :type="showInterfacePrivateKey ? 'text' : 'password'"
                                    v-model="config.privateKey"
                                    @input="derivePublicKey"
                                    class="h-9 w-full rounded-md border border-gray-300 box-border bg-white pl-2.5 pr-16 font-mono text-sm transition-colors focus:border-black focus:outline-none"
                                />
                                <button
                                    class="absolute right-8 top-1/2 -translate-y-1/2 cursor-pointer rounded p-0.5 text-gray-400 transition-colors hover:text-gray-700"
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
                                    class="absolute right-2 top-1/2 -translate-y-1/2 cursor-pointer rounded p-0.5 text-gray-400 transition-colors hover:text-gray-700"
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

                        <div>
                            <label class="mb-1 block text-xs font-semibold text-gray-500">
                                PublicKey (公钥 - 由私钥自动生成)
                            </label>
                            <div class="flex items-center gap-1.5">
                                <input
                                    type="text"
                                    v-model="config.publicKey"
                                    readonly
                                    class="h-9 min-w-0 flex-1 cursor-not-allowed rounded-md border border-gray-300 box-border bg-gray-100 px-2.5 font-mono text-sm text-gray-500 transition-colors focus:outline-none"
                                />
                                <button
                                    class="h-9 shrink-0 cursor-pointer rounded-md border border-sky-600 bg-sky-600 px-2.5 text-sm font-semibold text-white transition-colors hover:border-sky-700 hover:bg-sky-700"
                                    type="button"
                                    @click="copyPublicKey"
                                >
                                    复制
                                </button>
                            </div>
                        </div>
                    </div>
                </section>

                <section class="rounded-lg border border-gray-200 bg-gray-50/70 p-3">
                    <div class="flex items-center justify-between gap-2">
                        <h3 class="text-sm font-semibold text-gray-700">路由规则</h3>
                        <span class="text-xs font-semibold text-gray-400">PostUp / PostDown</span>
                    </div>

                    <div class="mt-2 grid grid-cols-4 gap-1.5">
                        <button
                            v-for="option in FIREWALL_PRESET_OPTIONS"
                            :key="option.value"
                            type="button"
                            class="h-8 cursor-pointer rounded-md border text-sm font-semibold transition-colors"
                            :class="
                                config.firewall === option.value
                                    ? 'border-sky-600 bg-sky-600 text-white'
                                    : 'border-gray-300 bg-white text-gray-600 hover:border-gray-500 hover:text-gray-900'
                            "
                            :aria-pressed="config.firewall === option.value"
                            @click="applyFirewallPreset(option.value)"
                        >
                            {{ option.label }}
                        </button>
                    </div>

                    <div class="mt-1.5 divide-y divide-gray-200">
                        <div class="pb-2">
                            <div class="flex items-center justify-between gap-2">
                                <button
                                    type="button"
                                    class="flex cursor-pointer items-center gap-1.5 text-sm font-semibold text-gray-600 transition-colors hover:text-black"
                                    :aria-expanded="postUpExpanded"
                                    @click="postUpExpanded = !postUpExpanded"
                                >
                                    <svg
                                        viewBox="0 0 20 20"
                                        class="h-4 w-4 transition-transform"
                                        :class="postUpExpanded ? 'rotate-90' : ''"
                                        fill="none"
                                        aria-hidden="true"
                                    >
                                        <path
                                            d="M8 5l5 5-5 5"
                                            stroke="currentColor"
                                            stroke-width="1.8"
                                            stroke-linecap="round"
                                            stroke-linejoin="round"
                                        />
                                    </svg>
                                    PostUp
                                    <span
                                        class="rounded bg-white px-1.5 py-0.5 text-xs font-semibold text-gray-500 ring-1 ring-gray-200"
                                    >
                                        {{ config.postUp.length }}
                                    </span>
                                </button>
                                <button
                                    type="button"
                                    class="shrink-0 cursor-pointer rounded border border-dashed border-gray-300 bg-white px-2 py-0.5 text-xs font-semibold text-gray-500 transition-colors hover:border-black hover:text-black"
                                    @click="addPostUp"
                                >
                                    + 添加规则
                                </button>
                            </div>
                            <div v-show="postUpExpanded" ref="postUpListRef" class="mt-2 space-y-1.5">
                                <div
                                    v-for="(_, index) in config.postUp"
                                    :key="'up' + index"
                                    data-sortable-item
                                    class="flex items-center gap-1.5"
                                >
                                    <button
                                        type="button"
                                        data-drag-handle
                                        class="shrink-0 cursor-grab rounded p-1 text-gray-300 transition-colors hover:bg-white hover:text-gray-500 focus-visible:ring-1 focus-visible:ring-sky-400 focus-visible:outline-none"
                                        title="拖动调整顺序，也可以用上下方向键"
                                        :aria-label="`第 ${index + 1} 条 PostUp 规则，可拖动或用上下方向键调整顺序`"
                                        @keydown.up.prevent="moveItemByKeyboard(config.postUp, -1, $event)"
                                        @keydown.down.prevent="moveItemByKeyboard(config.postUp, 1, $event)"
                                    >
                                        <svg viewBox="0 0 20 20" class="h-4 w-4" fill="currentColor" aria-hidden="true">
                                            <circle cx="7" cy="4" r="1.3" />
                                            <circle cx="13" cy="4" r="1.3" />
                                            <circle cx="7" cy="10" r="1.3" />
                                            <circle cx="13" cy="10" r="1.3" />
                                            <circle cx="7" cy="16" r="1.3" />
                                            <circle cx="13" cy="16" r="1.3" />
                                        </svg>
                                    </button>
                                    <input
                                        type="text"
                                        v-model="config.postUp[index]"
                                        @input="markFirewallCustom"
                                        class="h-9 min-w-0 flex-1 rounded-md border border-gray-300 box-border bg-white px-2.5 font-mono text-sm transition-colors focus:border-black focus:outline-none"
                                    />
                                    <button
                                        type="button"
                                        class="shrink-0 cursor-pointer rounded p-1 text-gray-400 transition-colors hover:bg-white hover:text-red-600"
                                        :aria-label="`删除第 ${index + 1} 条 PostUp 规则`"
                                        title="删除"
                                        @click="removePostUp(index)"
                                    >
                                        <svg viewBox="0 0 20 20" class="h-4 w-4" fill="none" aria-hidden="true">
                                            <path
                                                d="M5.5 5.5l9 9m0-9l-9 9"
                                                stroke="currentColor"
                                                stroke-width="1.8"
                                                stroke-linecap="round"
                                            />
                                        </svg>
                                    </button>
                                </div>
                                <p v-if="!config.postUp.length" class="px-1 text-xs text-gray-400">
                                    暂无规则，点击右上角「+ 添加规则」。
                                </p>
                            </div>
                        </div>

                        <div class="pt-2 pb-1">
                            <div class="flex items-center justify-between gap-2">
                                <button
                                    type="button"
                                    class="flex cursor-pointer items-center gap-1.5 text-sm font-semibold text-gray-600 transition-colors hover:text-black"
                                    :aria-expanded="postDownExpanded"
                                    @click="postDownExpanded = !postDownExpanded"
                                >
                                    <svg
                                        viewBox="0 0 20 20"
                                        class="h-4 w-4 transition-transform"
                                        :class="postDownExpanded ? 'rotate-90' : ''"
                                        fill="none"
                                        aria-hidden="true"
                                    >
                                        <path
                                            d="M8 5l5 5-5 5"
                                            stroke="currentColor"
                                            stroke-width="1.8"
                                            stroke-linecap="round"
                                            stroke-linejoin="round"
                                        />
                                    </svg>
                                    PostDown
                                    <span
                                        class="rounded bg-white px-1.5 py-0.5 text-xs font-semibold text-gray-500 ring-1 ring-gray-200"
                                    >
                                        {{ config.postDown.length }}
                                    </span>
                                </button>
                                <button
                                    type="button"
                                    class="shrink-0 cursor-pointer rounded border border-dashed border-gray-300 bg-white px-2 py-0.5 text-xs font-semibold text-gray-500 transition-colors hover:border-black hover:text-black"
                                    @click="addPostDown"
                                >
                                    + 添加规则
                                </button>
                            </div>
                            <div v-show="postDownExpanded" ref="postDownListRef" class="mt-2 space-y-1.5">
                                <div
                                    v-for="(_, index) in config.postDown"
                                    :key="'down' + index"
                                    data-sortable-item
                                    class="flex items-center gap-1.5"
                                >
                                    <button
                                        type="button"
                                        data-drag-handle
                                        class="shrink-0 cursor-grab rounded p-1 text-gray-300 transition-colors hover:bg-white hover:text-gray-500 focus-visible:ring-1 focus-visible:ring-sky-400 focus-visible:outline-none"
                                        title="拖动调整顺序，也可以用上下方向键"
                                        :aria-label="`第 ${index + 1} 条 PostDown 规则，可拖动或用上下方向键调整顺序`"
                                        @keydown.up.prevent="moveItemByKeyboard(config.postDown, -1, $event)"
                                        @keydown.down.prevent="moveItemByKeyboard(config.postDown, 1, $event)"
                                    >
                                        <svg viewBox="0 0 20 20" class="h-4 w-4" fill="currentColor" aria-hidden="true">
                                            <circle cx="7" cy="4" r="1.3" />
                                            <circle cx="13" cy="4" r="1.3" />
                                            <circle cx="7" cy="10" r="1.3" />
                                            <circle cx="13" cy="10" r="1.3" />
                                            <circle cx="7" cy="16" r="1.3" />
                                            <circle cx="13" cy="16" r="1.3" />
                                        </svg>
                                    </button>
                                    <input
                                        type="text"
                                        v-model="config.postDown[index]"
                                        @input="markFirewallCustom"
                                        class="h-9 min-w-0 flex-1 rounded-md border border-gray-300 box-border bg-white px-2.5 font-mono text-sm transition-colors focus:border-black focus:outline-none"
                                    />
                                    <button
                                        type="button"
                                        class="shrink-0 cursor-pointer rounded p-1 text-gray-400 transition-colors hover:bg-white hover:text-red-600"
                                        :aria-label="`删除第 ${index + 1} 条 PostDown 规则`"
                                        title="删除"
                                        @click="removePostDown(index)"
                                    >
                                        <svg viewBox="0 0 20 20" class="h-4 w-4" fill="none" aria-hidden="true">
                                            <path
                                                d="M5.5 5.5l9 9m0-9l-9 9"
                                                stroke="currentColor"
                                                stroke-width="1.8"
                                                stroke-linecap="round"
                                            />
                                        </svg>
                                    </button>
                                </div>
                                <p v-if="!config.postDown.length" class="px-1 text-xs text-gray-400">
                                    暂无规则，点击右上角「+ 添加规则」。
                                </p>
                            </div>
                        </div>
                    </div>
                </section>
            </div>

            <div class="mt-4 mb-2 flex items-center justify-between gap-2 border-b border-gray-200 pb-2">
                <h2 class="text-base font-semibold">
                    对等节点 (Peers)
                    <span class="ml-1 rounded bg-gray-100 px-1.5 py-0.5 text-xs font-semibold text-gray-500">
                        {{ config.peers.length }}
                    </span>
                </h2>
                <button
                    class="h-8 shrink-0 cursor-pointer rounded border border-sky-600 bg-sky-600 px-2.5 text-sm font-semibold text-white transition-colors hover:border-sky-700 hover:bg-sky-700"
                    type="button"
                    @click="regenerateAllPeerKeys"
                >
                    重新生成所有密钥
                </button>
            </div>

            <div ref="peerListRef" class="space-y-2">
                <div
                    class="overflow-hidden rounded-lg border shadow-sm transition-colors"
                    :class="[
                        PEER_BACKGROUND_COLORS[index % PEER_BACKGROUND_COLORS.length] ?? 'bg-white',
                        hasPeerIssue(peer) ? 'border-red-400 ring-1 ring-red-200' : 'border-gray-200',
                    ]"
                    v-for="(peer, index) in config.peers"
                    :key="peer.id"
                    data-sortable-item
                >
                    <div
                        class="group flex cursor-pointer items-center gap-1.5 px-2.5 py-2 transition-colors hover:bg-sky-100"
                        role="button"
                        tabindex="0"
                        @click="peer.expanded = !peer.expanded"
                        @keydown.enter.prevent="peer.expanded = !peer.expanded"
                        @keydown.space.prevent="peer.expanded = !peer.expanded"
                    >
                        <button
                            type="button"
                            data-drag-handle
                            class="shrink-0 cursor-grab rounded p-1 text-gray-400 transition-colors hover:bg-gray-200/70 hover:text-gray-600 focus-visible:ring-1 focus-visible:ring-sky-400 focus-visible:outline-none"
                            title="拖动调整节点顺序，也可以用上下方向键"
                            :aria-label="`调整节点 ${getPeerLabel(peer, index)} 的顺序`"
                            @click.stop
                            @keydown.up.prevent.stop="moveItemByKeyboard(config.peers, -1, $event)"
                            @keydown.down.prevent.stop="moveItemByKeyboard(config.peers, 1, $event)"
                            @keydown.enter.stop
                            @keydown.space.stop
                        >
                            <svg viewBox="0 0 20 20" class="h-4 w-4" fill="currentColor" aria-hidden="true">
                                <circle cx="7" cy="4" r="1.3" />
                                <circle cx="13" cy="4" r="1.3" />
                                <circle cx="7" cy="10" r="1.3" />
                                <circle cx="13" cy="10" r="1.3" />
                                <circle cx="7" cy="16" r="1.3" />
                                <circle cx="13" cy="16" r="1.3" />
                            </svg>
                        </button>
                        <span class="w-4 shrink-0 text-center text-xs font-semibold text-gray-400">
                            {{ index + 1 }}
                        </span>
                        <span
                            class="w-12 shrink-0 rounded border border-gray-200 bg-white px-1.5 py-0.5 text-center font-mono text-xs text-gray-600"
                            title="主机号"
                        >
                            {{ getPeerHostPart(peer) }}
                        </span>
                        <span
                            class="min-w-0 flex-1 truncate text-sm font-semibold text-gray-600 transition-colors group-hover:text-gray-800"
                        >
                            {{ getPeerLabel(peer, index) }}
                        </span>
                        <span
                            v-if="getPeerIssueLabel(peer)"
                            class="shrink-0 rounded bg-red-100 px-1.5 py-0.5 text-xs font-semibold text-red-600"
                            :title="getPeerIssueMessage(peer)"
                        >
                            {{ getPeerIssueLabel(peer) }}
                        </span>
                        <svg
                            viewBox="0 0 20 20"
                            class="h-4 w-4 shrink-0 text-gray-400 transition-transform"
                            :class="peer.expanded ? '' : '-rotate-90'"
                            fill="none"
                            aria-hidden="true"
                        >
                            <path
                                d="M5 8l5 5 5-5"
                                stroke="currentColor"
                                stroke-width="1.8"
                                stroke-linecap="round"
                                stroke-linejoin="round"
                            />
                        </svg>
                    </div>

                    <div v-show="peer.expanded" class="border-t border-dashed border-gray-200 px-2.5 pb-2.5 pt-2.5">
                        <div
                            v-if="getPeerIssueMessage(peer)"
                            class="mb-2.5 rounded border border-red-300 bg-red-50 px-2.5 py-1.5 text-xs font-semibold text-red-700"
                        >
                            {{ getPeerIssueMessage(peer) }}
                        </div>

                        <div class="grid grid-cols-[4.5rem_1fr] gap-x-3 gap-y-2.5">
                            <div>
                                <label class="mb-1 block text-xs font-semibold text-gray-500">主机号</label>
                                <input
                                    type="number"
                                    min="1"
                                    step="1"
                                    v-model.number="peer.hostPart"
                                    placeholder="101"
                                    class="h-9 w-full rounded-md border border-gray-300 box-border px-2.5 font-mono text-sm transition-colors focus:border-black focus:outline-none"
                                />
                            </div>
                            <div>
                                <label class="mb-1 block text-xs font-semibold text-gray-500">节点备注</label>
                                <input
                                    type="text"
                                    v-model="peer.name"
                                    placeholder="例如: 手机 / 笔记本"
                                    class="h-9 w-full rounded-md border border-gray-300 box-border px-2.5 text-sm transition-colors focus:border-black focus:outline-none"
                                />
                            </div>

                            <div class="col-span-2">
                                <label class="mb-1 block text-xs font-semibold text-gray-500">
                                    PrivateKey (私钥)
                                </label>
                                <div class="relative">
                                    <input
                                        :type="peer.showPrivateKey ? 'text' : 'password'"
                                        v-model="peer.privateKey"
                                        @input="derivePeerPublicKey(peer)"
                                        class="h-9 w-full rounded-md border border-gray-300 box-border pl-2.5 pr-16 font-mono text-sm transition-colors focus:border-black focus:outline-none"
                                    />
                                    <button
                                        class="absolute right-8 top-1/2 -translate-y-1/2 cursor-pointer rounded p-0.5 text-gray-400 transition-colors hover:text-gray-700"
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
                                        class="absolute right-2 top-1/2 -translate-y-1/2 cursor-pointer rounded p-0.5 text-gray-400 transition-colors hover:text-gray-700"
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

                            <div class="col-span-2">
                                <label class="mb-1 block text-xs font-semibold text-gray-500">
                                    PublicKey (节点公钥)
                                </label>
                                <div class="flex items-center gap-1.5">
                                    <input
                                        type="text"
                                        v-model="peer.publicKey"
                                        readonly
                                        class="h-9 min-w-0 flex-1 cursor-not-allowed rounded-md border border-gray-300 box-border bg-gray-100 px-2.5 font-mono text-sm text-gray-500 transition-colors focus:outline-none"
                                    />
                                    <button
                                        class="h-9 shrink-0 cursor-pointer rounded-md border border-sky-600 bg-sky-600 px-2.5 text-sm font-semibold text-white transition-colors hover:border-sky-700 hover:bg-sky-700"
                                        type="button"
                                        @click="copyPeerPublicKey(peer)"
                                    >
                                        复制
                                    </button>
                                </div>
                            </div>

                            <div class="col-span-2">
                                <label class="mb-1 block text-xs font-semibold text-gray-500">
                                    PresharedKey (预共享密钥)
                                </label>
                                <div class="flex items-center gap-1.5">
                                    <input
                                        type="text"
                                        v-model="peer.presharedKey"
                                        readonly
                                        class="h-9 min-w-0 flex-1 cursor-not-allowed rounded-md border border-gray-300 box-border bg-gray-100 px-2.5 font-mono text-sm text-gray-500 transition-colors focus:outline-none"
                                    />
                                    <button
                                        class="h-9 shrink-0 cursor-pointer rounded-md border border-sky-600 bg-sky-600 px-2.5 text-sm font-semibold text-white transition-colors hover:border-sky-700 hover:bg-sky-700"
                                        type="button"
                                        @click="copyPeerPresharedKey(peer)"
                                    >
                                        复制
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div class="mt-2.5 flex justify-end gap-1.5">
                            <button
                                class="h-8 cursor-pointer rounded border border-gray-300 bg-white px-2.5 text-sm font-semibold text-gray-700 transition-colors hover:border-gray-800 hover:bg-gray-800 hover:text-white disabled:cursor-not-allowed disabled:border-gray-200 disabled:bg-gray-50 disabled:text-gray-300 disabled:hover:border-gray-200 disabled:hover:bg-gray-50 disabled:hover:text-gray-300"
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
                                class="h-8 cursor-pointer rounded border border-sky-200 bg-white px-2.5 text-sm font-semibold text-sky-700 transition-colors hover:border-sky-700 hover:bg-sky-700 hover:text-white disabled:cursor-not-allowed disabled:border-gray-200 disabled:text-gray-300 disabled:hover:border-gray-200 disabled:hover:bg-white disabled:hover:text-gray-300"
                                type="button"
                                :disabled="hasPeerIssue(peer)"
                                :title="hasPeerIssue(peer) ? '该节点配置有误，请先修正' : '复制该节点的客户端配置'"
                                @click="copyClientConfig(peer)"
                            >
                                复制客户端配置
                            </button>
                            <button
                                class="h-8 cursor-pointer rounded border border-gray-300 bg-white px-2.5 text-sm font-semibold text-gray-700 transition-colors hover:border-gray-800 hover:bg-gray-800 hover:text-white disabled:cursor-not-allowed disabled:border-gray-200 disabled:bg-gray-50 disabled:text-gray-300 disabled:hover:border-gray-200 disabled:hover:bg-gray-50 disabled:hover:text-gray-300"
                                type="button"
                                :disabled="hasPeerIssue(peer)"
                                :title="
                                    hasPeerIssue(peer)
                                        ? '该节点配置有误，请先修正'
                                        : '显示客户端配置二维码，手机扫码即可导入'
                                "
                                @click="openPeerQr(peer, index)"
                            >
                                二维码
                            </button>
                            <button
                                class="h-8 cursor-pointer rounded border border-red-200 bg-white px-2.5 text-sm font-semibold text-red-600 transition-colors hover:border-red-600 hover:bg-red-600 hover:text-white"
                                type="button"
                                @click="removePeer(index)"
                            >
                                删除此节点
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <button
                class="mt-2 h-9 w-full cursor-pointer rounded-md border border-dashed border-gray-300 bg-white text-sm font-semibold text-gray-600 transition-colors hover:border-black hover:text-black"
                @click="addPeer"
            >
                + 添加新节点
            </button>
            <div class="h-6"></div>
        </div>

        <div class="flex w-1/2 min-h-0 flex-col bg-gray-50 box-border">
            <div class="flex items-center justify-between gap-2 border-b border-gray-200 px-4 pb-2 pt-4">
                <h2 class="text-base font-semibold">配置预览</h2>
                <button
                    class="h-8 shrink-0 cursor-pointer rounded border border-sky-600 bg-sky-600 px-2.5 text-sm font-semibold text-white transition-colors hover:border-sky-700 hover:bg-sky-700 disabled:cursor-not-allowed disabled:border-gray-300 disabled:bg-gray-300 disabled:hover:border-gray-300 disabled:hover:bg-gray-300"
                    type="button"
                    :disabled="hasConfigError"
                    :title="hasConfigError ? '配置有误，请先修正标红的项' : '下载配置包 (wg0.conf + 各节点客户端配置)'"
                    @click="downloadConfigPackage"
                >
                    下载配置包
                </button>
            </div>

            <div class="min-h-0 flex-1 space-y-2 overflow-y-auto px-4 py-3">
                <section class="overflow-hidden rounded-lg border border-gray-200 bg-white">
                    <div class="flex items-center gap-2 py-2 pl-3 pr-2">
                        <button
                            type="button"
                            class="flex min-w-0 flex-1 cursor-pointer items-center gap-2 text-left focus-visible:outline-none"
                            :aria-expanded="isConfigSectionExpanded('relay')"
                            @click="toggleConfigSection('relay')"
                        >
                            <svg
                                viewBox="0 0 20 20"
                                class="h-4 w-4 shrink-0 text-gray-400 transition-transform"
                                :class="isConfigSectionExpanded('relay') ? 'rotate-90' : ''"
                                fill="none"
                                aria-hidden="true"
                            >
                                <path
                                    d="M8 5l5 5-5 5"
                                    stroke="currentColor"
                                    stroke-width="1.8"
                                    stroke-linecap="round"
                                    stroke-linejoin="round"
                                />
                            </svg>
                            <span class="truncate text-sm font-semibold text-gray-700">中继节点</span>
                            <span class="shrink-0 rounded bg-gray-100 px-1.5 py-0.5 font-mono text-xs text-gray-500">
                                wg0.conf
                            </span>
                        </button>
                        <button
                            type="button"
                            class="h-7 shrink-0 cursor-pointer rounded border border-sky-200 bg-white px-2 text-xs font-semibold text-sky-700 transition-colors hover:border-sky-700 hover:bg-sky-700 hover:text-white disabled:cursor-not-allowed disabled:border-gray-200 disabled:text-gray-300 disabled:hover:border-gray-200 disabled:hover:bg-white disabled:hover:text-gray-300"
                            :disabled="hasConfigError"
                            :title="hasConfigError ? '配置有误，请先修正标红的项' : '复制 wg0.conf'"
                            @click="copyGeneratedConfig"
                        >
                            复制
                        </button>
                    </div>
                    <pre
                        v-if="isConfigSectionExpanded('relay')"
                        class="border-t border-gray-200 bg-gray-50/60 p-3 font-mono text-sm leading-6 whitespace-pre-wrap wrap-break-word"
                        >{{ generatedConfig }}</pre>
                </section>

                <section
                    v-for="(peer, index) in config.peers"
                    :key="peer.id"
                    class="overflow-hidden rounded-lg border border-gray-200 bg-white"
                >
                    <div class="flex items-center gap-2 py-2 pl-3 pr-2">
                        <button
                            type="button"
                            class="flex min-w-0 flex-1 cursor-pointer items-center gap-2 text-left focus-visible:outline-none"
                            :aria-expanded="isConfigSectionExpanded(`peer-${peer.id}`)"
                            @click="toggleConfigSection(`peer-${peer.id}`)"
                        >
                            <svg
                                viewBox="0 0 20 20"
                                class="h-4 w-4 shrink-0 text-gray-400 transition-transform"
                                :class="isConfigSectionExpanded(`peer-${peer.id}`) ? 'rotate-90' : ''"
                                fill="none"
                                aria-hidden="true"
                            >
                                <path
                                    d="M8 5l5 5-5 5"
                                    stroke="currentColor"
                                    stroke-width="1.8"
                                    stroke-linecap="round"
                                    stroke-linejoin="round"
                                />
                            </svg>
                            <span class="shrink-0 rounded bg-gray-100 px-1.5 py-0.5 font-mono text-xs text-gray-500">
                                {{ getPeerHostPart(peer) }}
                            </span>
                            <span class="truncate text-sm font-semibold text-gray-700">
                                {{ getPeerLabel(peer, index) }}
                            </span>
                        </button>
                        <button
                            type="button"
                            class="h-7 shrink-0 cursor-pointer rounded border border-sky-200 bg-white px-2 text-xs font-semibold text-sky-700 transition-colors hover:border-sky-700 hover:bg-sky-700 hover:text-white disabled:cursor-not-allowed disabled:border-gray-200 disabled:text-gray-300 disabled:hover:border-gray-200 disabled:hover:bg-white disabled:hover:text-gray-300"
                            :disabled="hasPeerIssue(peer)"
                            :title="hasPeerIssue(peer) ? '该节点配置有误，请先修正' : '复制该节点的客户端配置'"
                            @click="copyClientConfig(peer)"
                        >
                            复制
                        </button>
                    </div>
                    <pre
                        v-if="isConfigSectionExpanded(`peer-${peer.id}`)"
                        class="border-t border-gray-200 bg-gray-50/60 p-3 font-mono text-sm leading-6 whitespace-pre-wrap wrap-break-word"
                        >{{ clientConfigs.get(peer.id) }}</pre>
                </section>
            </div>
        </div>

        <Teleport to="body">
            <div
                v-if="qrState"
                class="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-6"
                @click.self="closePeerQr"
            >
                <div
                    class="flex w-full max-w-sm flex-col items-center rounded-xl bg-white p-5 shadow-2xl"
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="wg-peer-qr-title"
                >
                    <div class="mb-1 flex w-full items-center justify-between gap-3">
                        <h2 id="wg-peer-qr-title" class="text-sm font-semibold text-gray-700">客户端配置二维码</h2>
                        <button
                            ref="qrCloseButtonRef"
                            type="button"
                            class="cursor-pointer rounded p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700 focus-visible:ring-1 focus-visible:ring-sky-400 focus-visible:outline-none"
                            aria-label="关闭"
                            title="关闭（Esc）"
                            @click="closePeerQr"
                        >
                            <svg viewBox="0 0 20 20" class="h-4 w-4" fill="none" aria-hidden="true">
                                <path
                                    d="M5.5 5.5l9 9m0-9l-9 9"
                                    stroke="currentColor"
                                    stroke-width="1.8"
                                    stroke-linecap="round"
                                />
                            </svg>
                        </button>
                    </div>
                    <p class="mb-3 w-full truncate text-center font-mono text-xs text-gray-500">
                        {{ qrState.title }}
                    </p>
                    <svg
                        v-if="qrCode"
                        :viewBox="`0 0 ${qrCode.size} ${qrCode.size}`"
                        class="h-64 w-64 rounded-lg border border-gray-200 p-1"
                        shape-rendering="crispEdges"
                        role="img"
                        :aria-label="`${qrState.title} 的客户端配置二维码`"
                    >
                        <rect :width="qrCode.size" :height="qrCode.size" fill="#ffffff" />
                        <path :d="qrCode.path" fill="#000000" />
                    </svg>
                    <p class="mt-3 text-center text-xs text-gray-500">用 WireGuard 客户端「从二维码导入」扫描</p>
                </div>
            </div>
        </Teleport>
    </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref, watch } from "vue";
import JSZip from "jszip";
import Sortable, { type SortableEvent } from "sortablejs";
import nacl from "tweetnacl";
import { encode as encodeQrCode } from "uqr";

interface Peer {
    id: number;
    name: string;
    privateKey: string;
    publicKey: string;
    presharedKey: string;
    hostPart: number | null;
    expanded: boolean;
    showPrivateKey: boolean;
}

type FirewallPreset = "custom" | "none" | "nft" | "iptables";

interface WgConfig {
    host: string;
    port: number | null;
    mtu: number | null;
    relayServer: string;
    privateKey: string;
    publicKey: string;
    firewall: FirewallPreset;
    postUp: string[];
    postDown: string[];
    peers: Peer[];
}

interface FirewallRules {
    postUp: readonly string[];
    postDown: readonly string[];
}

interface PeerIssue {
    missingHostPart: boolean;
    invalidHostPart: number | null;
    duplicateHostPart: number | null;
    invalidKey: boolean;
    invalidPresharedKey: boolean;
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

// 预设只是把规则一次性填进列表，之后仍然可以逐条修改；custom 表示完全手写。
const FIREWALL_PRESETS: Record<Exclude<FirewallPreset, "custom">, FirewallRules> = {
    none: { postUp: [], postDown: [] },
    nft: {
        postUp: [
            "nft delete table ip wg0nat 2>/dev/null || true",
            "nft add table ip wg0nat",
            "nft add chain ip wg0nat post '{ type nat hook postrouting priority 100; }'",
            'nft add rule ip wg0nat post oifname "eth0" masquerade',
            "nft delete table inet wg0fwd 2>/dev/null || true",
            "nft add table inet wg0fwd",
            "nft add chain inet wg0fwd forward '{ type filter hook forward priority 0; }'",
            'nft add rule inet wg0fwd forward iifname "wg0" accept',
            'nft add rule inet wg0fwd forward oifname "wg0" accept',
        ],
        postDown: [
            "nft delete table ip wg0nat 2>/dev/null || true",
            "nft delete table inet wg0fwd 2>/dev/null || true",
        ],
    },
    // PostUp 先 -C 检查再 -A，PostDown 忽略删除失败，重复执行不会叠加或报错。
    iptables: {
        postUp: [
            "iptables -C FORWARD -i %i -j ACCEPT 2>/dev/null || iptables -A FORWARD -i %i -j ACCEPT",
            "iptables -C FORWARD -o %i -j ACCEPT 2>/dev/null || iptables -A FORWARD -o %i -j ACCEPT",
            "iptables -t nat -C POSTROUTING -o eth0 -j MASQUERADE 2>/dev/null || iptables -t nat -A POSTROUTING -o eth0 -j MASQUERADE",
        ],
        postDown: [
            "iptables -D FORWARD -i %i -j ACCEPT 2>/dev/null || true",
            "iptables -D FORWARD -o %i -j ACCEPT 2>/dev/null || true",
            "iptables -t nat -D POSTROUTING -o eth0 -j MASQUERADE 2>/dev/null || true",
        ],
    },
};

const FIREWALL_PRESET_OPTIONS: ReadonlyArray<{ value: FirewallPreset; label: string }> = [
    { value: "custom", label: "自定义" },
    { value: "none", label: "无" },
    { value: "nft", label: "nft" },
    { value: "iptables", label: "iptables" },
];

const isFirewallPreset = (value: unknown): value is FirewallPreset =>
    typeof value === "string" && FIREWALL_PRESET_OPTIONS.some((option) => option.value === value);

const toStringArray = (value: unknown): string[] =>
    Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];

const normalizeRules = (rules: readonly string[]): string[] =>
    rules.map((rule) => rule.trim()).filter((rule) => rule.length > 0);

const sameRules = (a: string[], b: string[]): boolean => a.length === b.length && a.every((rule, i) => rule === b[i]);

// 导入或读取旧数据时，把已有的 PostUp / PostDown 还原成预设；对不上任何预设时返回 null。
const detectFirewallPreset = (postUp: readonly string[], postDown: readonly string[]): FirewallPreset | null => {
    const up = normalizeRules(postUp);
    const down = normalizeRules(postDown);
    if (up.length === 0 && down.length === 0) return "none";

    for (const preset of ["nft", "iptables"] as const) {
        const rules = FIREWALL_PRESETS[preset];
        if (sameRules(up, normalizeRules(rules.postUp)) && sameRules(down, normalizeRules(rules.postDown))) {
            return preset;
        }
    }
    return null;
};

const createDefaultConfig = (): WgConfig => ({
    host: "10.8.0.1",
    port: 51820,
    mtu: 1420,
    relayServer: "",
    privateKey: "",
    publicKey: "",
    firewall: "custom",
    postUp: [],
    postDown: [],
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
const importFileInputRef = ref<HTMLInputElement | null>(null);

// 规则列表默认折叠，把空间让给接口字段和节点；数量在标题上仍然看得到。
const postUpExpanded = ref(false);
const postDownExpanded = ref(false);
const postUpListRef = ref<HTMLElement | null>(null);
const postDownListRef = ref<HTMLElement | null>(null);
const peerListRef = ref<HTMLElement | null>(null);
const sortableInstances: Sortable[] = [];

let peerIdCounter = 0;

const saveConfig = () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
};

const normalizeSavedConfig = (savedConfig: Partial<WgConfig>): WgConfig => {
    const merged = { ...createDefaultConfig(), ...savedConfig } as WgConfig & { postUp?: unknown; postDown?: unknown };
    const savedPostUp = merged.postUp;
    const savedPostDown = merged.postDown;
    const hasSavedRules = Array.isArray(savedPostUp) || Array.isArray(savedPostDown);
    merged.postUp = toStringArray(savedPostUp);
    merged.postDown = toStringArray(savedPostDown);

    if (!isFirewallPreset(merged.firewall)) merged.firewall = "custom";

    if (hasSavedRules) {
        // 规则内容才是事实来源：对得上哪个预设就高亮哪个，对不上（例如预设改过版）就是自定义。
        merged.firewall = detectFirewallPreset(merged.postUp, merged.postDown) ?? "custom";
    } else if (merged.firewall !== "custom") {
        // 只有预设名、没有规则数组时按预设填充，避免选了预设却拿不到规则。
        const rules = FIREWALL_PRESETS[merged.firewall];
        merged.postUp = [...rules.postUp];
        merged.postDown = [...rules.postDown];
    }

    if (typeof merged.host === "string" && merged.host.endsWith("/24")) {
        merged.host = merged.host.slice(0, -3);
    }

    const savedPeers = Array.isArray(savedConfig.peers) ? savedConfig.peers : [];
    merged.peers = savedPeers.map((peer, index) => ({
        id: typeof peer.id === "number" ? peer.id : index,
        name: typeof peer.name === "string" ? peer.name : "",
        privateKey: typeof peer.privateKey === "string" ? peer.privateKey : "",
        publicKey: typeof peer.publicKey === "string" ? peer.publicKey : "",
        presharedKey: typeof peer.presharedKey === "string" ? peer.presharedKey : "",
        hostPart: typeof peer.hostPart === "number" && Number.isFinite(peer.hostPart) ? peer.hostPart : null,
        expanded: typeof peer.expanded === "boolean" ? peer.expanded : true,
        showPrivateKey: typeof peer.showPrivateKey === "boolean" ? peer.showPrivateKey : false,
    }));

    peerIdCounter = merged.peers.reduce((maxId, peer) => Math.max(maxId, peer.id + 1), 0);
    merged.peers.forEach((peer) => {
        ensurePeerKeyPair(peer);
        ensurePeerPresharedKey(peer);
    });

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

// PSK 是两端共享的对称密钥，和 WireGuard 的要求一致：32 字节随机数、标准 base64。
const generatePresharedKey = (): string => {
    const bytes = new Uint8Array(32);
    crypto.getRandomValues(bytes);
    return encodeBase64(bytes);
};

const ensurePeerPresharedKey = (peer: Peer) => {
    if (!peer.presharedKey.trim()) peer.presharedKey = generatePresharedKey();
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

// 选中预设会整体覆盖规则列表，之后手动改动就回到自定义。
const applyFirewallPreset = (preset: FirewallPreset) => {
    config.firewall = preset;
    if (preset === "custom") return;

    const rules = FIREWALL_PRESETS[preset];
    config.postUp = [...rules.postUp];
    config.postDown = [...rules.postDown];
};

const markFirewallCustom = () => {
    config.firewall = "custom";
};

const addPostUp = () => {
    config.postUp.push("");
    markFirewallCustom();
};

const addPostDown = () => {
    config.postDown.push("");
    markFirewallCustom();
};

const removePostUp = (index: number) => {
    config.postUp.splice(index, 1);
    markFirewallCustom();
};

const removePostDown = (index: number) => {
    config.postDown.splice(index, 1);
    markFirewallCustom();
};

const addPeer = () => {
    const peer: Peer = {
        id: peerIdCounter++,
        name: "",
        privateKey: "",
        publicKey: "",
        presharedKey: generatePresharedKey(),
        hostPart: null,
        expanded: true,
        showPrivateKey: false,
    };
    generatePeerKeys(peer);
    config.peers.push(peer);
};
const removePeer = (index: number) => config.peers.splice(index, 1);

const moveItem = <T,>(items: T[], from: number, to: number): void => {
    if (from === to || from < 0 || to < 0 || from >= items.length || to >= items.length) return;

    const [moved] = items.splice(from, 1);
    if (moved !== undefined) {
        items.splice(to, 0, moved);
    }
};

// 拖拽之外的键盘操作：规则列表用的是下标 key，重排后同一个 DOM 节点会留在原位，
// 所以必须把焦点挪到新位置，否则连按方向键会一直搬动同一行。
const moveItemByKeyboard = <T,>(items: T[], delta: number, event: KeyboardEvent): void => {
    const row = (event.currentTarget as HTMLElement | null)?.closest("[data-sortable-item]");
    const list = row?.parentElement;
    if (!row || !list) return;

    const from = [...list.querySelectorAll("[data-sortable-item]")].indexOf(row);
    if (from < 0) return;

    const to = from + delta;
    moveItem(items, from, to);

    void nextTick(() => {
        list.querySelectorAll<HTMLElement>("[data-drag-handle]")[to]?.focus();
    });
};

// SortableJS 改的是真实 DOM，而列表的渲染权在 Vue。拖拽结束后先把 DOM 还原成拖动前的顺序，
// 再改数据让 Vue 重新渲染；两边同时挪节点会撕开虚拟 DOM 和真实 DOM 的对应关系。
const createSortableList = (element: HTMLElement | null, onReorder: (from: number, to: number) => void): void => {
    if (!element) return;

    let nextSibling: ChildNode | null = null;

    sortableInstances.push(
        Sortable.create(element, {
            handle: "[data-drag-handle]",
            draggable: "[data-sortable-item]",
            animation: 150,
            // 用鼠标事件自己实现拖拽，而不是浏览器的原生 HTML5 拖放：面板本身是滚动容器，
            // 原生拖拽的预览图会被裁掉，各浏览器的表现也不一致。
            forceFallback: true,
            fallbackOnBody: true,
            fallbackTolerance: 3,
            ghostClass: "sortable-ghost",
            chosenClass: "sortable-chosen",
            fallbackClass: "sortable-fallback",
            onStart: (event: SortableEvent) => {
                nextSibling = event.item.nextSibling;
            },
            onEnd: (event: SortableEvent) => {
                const from = event.oldDraggableIndex ?? event.oldIndex;
                const to = event.newDraggableIndex ?? event.newIndex;

                if (nextSibling && nextSibling.parentNode === event.from) {
                    event.from.insertBefore(event.item, nextSibling);
                } else {
                    event.from.appendChild(event.item);
                }
                nextSibling = null;

                if (from === undefined || to === undefined) return;
                onReorder(from, to);
            },
        }),
    );
};

const getPeerLabel = (peer: Peer, index: number): string => peer.name.trim() || `节点 #${index + 1}`;

// 节点标题里主机号排在名字前面，占固定宽度，一列名字才能对齐。
// 网段前缀对所有节点都一样，不用重复显示。
const getPeerHostPart = (peer: Peer): string => {
    const hostPart = getHostPart(peer);

    return hostPart === null ? "—" : String(hostPart);
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

const hasInvalidPresharedKey = (peer: Peer): boolean => {
    const presharedKey = peer.presharedKey.trim();
    return presharedKey !== "" && !isValidWireGuardKey(presharedKey);
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
            invalidPresharedKey: false,
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

        if (hasInvalidPresharedKey(peer)) {
            getOrCreateIssue(peer).invalidPresharedKey = true;
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
    if (issue.invalidPresharedKey) {
        reasons.push("预共享密钥格式不正确");
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
    if (issue.invalidKey || issue.invalidPresharedKey) return "密钥有误";

    return "冲突";
};

const configIssues = computed((): string[] =>
    [getRelayServerIssue(), getHostIssue(), getPortIssue(), getMtuIssue(), getInterfaceKeyIssue()].filter(
        (issue) => issue !== "",
    ),
);

// 复制和下载产出的都是拿去直接使用的配置，只要有一处错误就整体禁用。
const hasConfigError = computed((): boolean => configIssues.value.length > 0 || peerIssues.value.size > 0);

const regenerateAllPeerKeys = () => {
    config.peers.forEach((peer) => {
        generatePeerKeys(peer);
        peer.presharedKey = generatePresharedKey();
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

const copyPeerPresharedKey = async (peer: Peer) => {
    ensurePeerPresharedKey(peer);
    await navigator.clipboard.writeText(peer.presharedKey);
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
            `PresharedKey = ${peer.presharedKey}`,
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

interface QrCode {
    size: number;
    path: string;
}

// 把二维码矩阵按行合并成一条 path（同色连续方格合成一段矩形），比几百个 rect 节点省得多。
const encodeQr = (text: string): QrCode => {
    const { size, data } = encodeQrCode(text, { ecc: "M", border: 4 });
    let path = "";

    for (let y = 0; y < size; y++) {
        const row = data[y]!;

        for (let x = 0; x < size;) {
            if (!row[x]) {
                x += 1;
                continue;
            }

            let run = 1;
            while (x + run < size && row[x + run]) run += 1;
            path += `M${x} ${y}h${run}v1h-${run}z`;
            x += run;
        }
    }

    return { size, path };
};

// 内容是弹出时的一份快照：弹窗期间表单被遮住，没必要跟着响应式刷新。
const qrState = ref<{ title: string; payload: string } | null>(null);
const qrCode = computed(() => (qrState.value ? encodeQr(qrState.value.payload) : null));
const qrCloseButtonRef = ref<HTMLButtonElement | null>(null);
let qrTriggerElement: HTMLElement | null = null;

const openPeerQr = (peer: Peer, index: number) => {
    ensurePeerKeyPair(peer);
    qrTriggerElement = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    qrState.value = {
        title: `${getPeerHostPart(peer)} · ${getPeerLabel(peer, index)}`,
        payload: buildClientConfig(peer),
    };
    void nextTick(() => qrCloseButtonRef.value?.focus());
};

const closePeerQr = () => {
    qrState.value = null;
    // 弹窗关掉后把焦点还给“二维码”按钮，键盘操作不会凭空回到页首。
    qrTriggerElement?.focus();
    qrTriggerElement = null;
};

const onQrKeydown = (event: KeyboardEvent) => {
    if (event.key === "Escape") closePeerQr();
};

watch(qrState, (state) => {
    if (state) {
        window.addEventListener("keydown", onQrKeydown);
        return;
    }

    window.removeEventListener("keydown", onQrKeydown);
});

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
    if (peer.presharedKey.trim()) lines.push(`PresharedKey = ${peer.presharedKey.trim()}`);
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
        const postUp = pairs.PostUp ?? [];
        const postDown = pairs.PostDown ?? [];

        if (address) imported.host = getHostBase(address);
        imported.port = parseOptionalInt(pairs.ListenPort?.[0]);
        imported.mtu = parseOptionalInt(pairs.MTU?.[0]);
        imported.privateKey = pairs.PrivateKey?.[0] ?? "";
        imported.postUp = postUp;
        imported.postDown = postDown;
        // 规则内容对得上哪个预设就高亮哪个，对不上就是自定义。
        imported.firewall = detectFirewallPreset(postUp, postDown) ?? "custom";
        imported.relayServer = interfaceSection.comments.find((comment) => !comment.startsWith("PublicKey =")) ?? "";
    }

    const wgPeerInfos = peerSections.map((section) => ({
        name: section.comments.find((comment) => !comment.startsWith("PublicKey =")) ?? "",
        publicKey: section.pairs.PublicKey?.[0] ?? "",
        presharedKey: section.pairs.PresharedKey?.[0] ?? "",
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

        const clientPeerSection = clientSections.find((section) => section.name === "Peer");
        const clientPeer: Peer = {
            id: 0,
            name: "",
            privateKey,
            publicKey: "",
            presharedKey: clientPeerSection?.pairs.PresharedKey?.[0] ?? "",
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
            presharedKey: wgPeerInfo.presharedKey || clientPeer?.presharedKey || "",
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
            presharedKey: clientPeer.presharedKey,
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
        const imported = await parseImportedConfigZip(zip);
        if (!imported) {
            alert("导入失败：压缩包中未找到 wg0.conf，无法识别为配置包。");
            return;
        }

        const normalized = normalizeSavedConfig(imported);
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

// 右侧预览按「中继 + 每个客户端」分块，各自可折叠。
const expandedConfigSections = reactive(new Set<string>());
const isConfigSectionExpanded = (key: string) => expandedConfigSections.has(key);
const toggleConfigSection = (key: string) => {
    if (expandedConfigSections.has(key)) expandedConfigSections.delete(key);
    else expandedConfigSections.add(key);
};

const clientConfigs = computed(() => {
    const map = new Map<number, string>();
    config.peers.forEach((peer) => map.set(peer.id, buildClientConfig(peer)));
    return map;
});

const generatedConfig = computed(() => {
    let conf = `[Interface]\n`;
    const hostBase = getHostBase(config.host);

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

onMounted(async () => {
    loadConfig();

    if (!config.privateKey) {
        generateKeys();
    } else if (!config.publicKey) {
        derivePublicKey();
    }

    // 列表容器用 v-show 折叠，始终留在 DOM 里，所以这里初始化一次就够了。
    await nextTick();
    createSortableList(postUpListRef.value, (from, to) => {
        moveItem(config.postUp, from, to);
        markFirewallCustom();
    });
    createSortableList(postDownListRef.value, (from, to) => {
        moveItem(config.postDown, from, to);
        markFirewallCustom();
    });
    createSortableList(peerListRef.value, (from, to) => moveItem(config.peers, from, to));
});

onBeforeUnmount(() => {
    sortableInstances.forEach((instance) => instance.destroy());
    sortableInstances.length = 0;
    window.removeEventListener("keydown", onQrKeydown);
});

watch(
    config,
    () => {
        saveConfig();
    },
    { deep: true },
);
</script>

<style scoped>
/* 拖动中的占位元素 */
.sortable-ghost {
    opacity: 0.4;
}

/* 鼠标下跟着光标走的克隆体（fallbackOnBody 时会挂到 body 上，克隆体会带着作用域属性） */
.sortable-fallback {
    cursor: grabbing;
    box-shadow: 0 8px 20px rgb(15 23 42 / 0.2);
}

.sortable-chosen {
    border-color: rgb(14 165 233);
    box-shadow: 0 6px 16px rgb(15 23 42 / 0.16);
}
</style>
