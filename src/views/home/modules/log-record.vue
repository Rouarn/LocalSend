<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, useTemplateRef } from 'vue';
import { NButton, NInput, NScrollbar, NSpace, NSwitch, NTag } from 'naive-ui';
import { useAppStore } from '@/store/modules/app';
import mittBus from '@/utils/mittBus';

const appStore = useAppStore();
const isMobile = computed(() => appStore.isMobile);

const logs = ref<Api.Websocket.LogInfo[]>([]);
const searchText = ref('');
const autoScroll = ref(true);
const logContainerRef = useTemplateRef('logContainer');

// 滚动到底部
const scrollToBottom = () => {
  nextTick(() => {
    if (logContainerRef.value) {
      const container = document.querySelector('.log-container  .n-scrollbar-content');

      if (container) {
        logContainerRef.value.scrollTo({ left: 0, top: container.scrollHeight, behavior: 'smooth' });
        return;
      }
      logContainerRef.value.scrollTo({ left: 0, top: 99999999999, behavior: 'smooth' });
    }
  });
};

// 处理日志推送
const handleLog = (log: Api.Websocket.LogInfo) => {
  logs.value.push(log);
  if (autoScroll.value) {
    scrollToBottom();
  }
};

// 清空日志
const clearLogs = () => {
  logs.value = [];
};

// 过滤日志
const filteredLogs = computed(() => {
  if (!searchText.value) return logs.value;
  return logs.value.filter(
    log =>
      log.message.toLowerCase().includes(searchText.value.toLowerCase()) ||
      log.type.toLowerCase().includes(searchText.value.toLowerCase())
  );
});

// 获取日志类型颜色
const getLogTypeColor = (type: string) => {
  switch (type) {
    case 'error':
      return 'error';
    case 'warn':
      return 'warning';
    case 'success':
      return 'success';
    case 'debug':
      return 'default';
    default:
      return 'info';
  }
};

// 格式化时间
const formatTime = () => {
  return new Date().toLocaleTimeString();
};

// 监听日志事件
onMounted(() => {
  mittBus.on('emit:logInfo', handleLog);
});

// 取消监听
onUnmounted(() => {
  mittBus.off('emit:logInfo', handleLog);
});
</script>

<template>
  <div class="console-logger">
    <!-- 工具栏 -->
    <div class="toolbar">
      <NSpace align="center" :size="isMobile ? 8 : 12">
        <NInput
          v-model:value="searchText"
          placeholder="搜索日志..."
          clearable
          class="search-input"
          :style="{ width: isMobile ? '10rem' : '12.5rem' }"
        >
          <template #prefix>
            <icon-el:search />
          </template>
        </NInput>

        <NButton size="small" text-color="#fff" @click="clearLogs">
          <template #icon><icon-heroicons-outline:archive-box-x-mark /></template>
          <span v-if="!isMobile">清空</span>
        </NButton>

        <NSwitch v-model:value="autoScroll" size="small">
          <template #checked>{{ isMobile ? '自动' : '自动滚动' }}</template>
          <template #unchecked>{{ isMobile ? '手动' : '手动滚动' }}</template>
        </NSwitch>
      </NSpace>
    </div>

    <!-- 日志内容区域 -->
    <NScrollbar ref="logContainer" class="log-container">
      <div class="log-content">
        <div v-for="log in filteredLogs" :key="log.id" class="log-item" :class="`type-${log.type}`">
          <div class="log-time">{{ formatTime() }}</div>
          <NTag :type="getLogTypeColor(log.type)" size="small" round class="log-type">
            {{ log.type.toUpperCase() }}
          </NTag>
          <div class="log-message">{{ log.message }}</div>
        </div>

        <div v-if="filteredLogs.length === 0" class="empty-tip">暂无日志数据</div>
      </div>
    </NScrollbar>
  </div>
</template>

<style scoped>
.console-logger {
  height: 100%;
  display: flex;
  flex-direction: column;
  background-color: #1e1e1e;
  color: #e0e0e0;
  font-family: 'Courier New', monospace;
  border-radius: 0.25rem;
  overflow: hidden;
}

.toolbar {
  padding: 0.5rem 0.75rem;
  background-color: #252526;
  border-bottom: 1px solid #333;
}

.log-container {
  flex: 1;
  padding: 0.5rem 0;
}

.log-content {
  padding: 0 0.75rem;
}

.log-item {
  display: flex;
  align-items: center;
  padding: 0.25rem 0;
  font-size: 0.8125rem;
  line-height: 1.5;
  border-bottom: 1px solid #2d2d2d;
}

.log-time {
  color: #858585;
  min-width: 5rem;
  margin-right: 0.75rem;
  font-size: 0.75rem;
}

.log-type {
  min-width: 3.125rem;
  margin-right: 0.75rem;
  text-align: center;
  font-size: 0.6875rem;
  font-weight: bold;
}

.log-message {
  flex: 1;
  word-break: break-word;
}

.empty-tip {
  padding: 1.25rem;
  text-align: center;
  color: #666;
}

/* 不同类型日志的颜色 */
.type-error .log-message {
  color: #f48771;
}

.type-warn .log-message {
  color: #ffcc66;
}

.type-success .log-message {
  color: #89d185;
}

.type-info .log-message {
  color: #9cdcfe;
}

.type-debug .log-message {
  color: #b5cea8;
}

@media (max-width: 768px) {
  .log-item {
    flex-wrap: wrap;
    padding: 0.5rem 0;
  }

  .log-time,
  .log-type {
    margin-bottom: 0.25rem;
  }

  .log-message {
    width: 100%;
    padding-left: 5rem; /* Align with first line */
  }
}
</style>
