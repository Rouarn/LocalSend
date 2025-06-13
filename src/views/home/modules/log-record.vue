<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref } from 'vue';
import { NButton, NInput, NScrollbar, NSpace, NTag } from 'naive-ui';
import mittBus from '@/utils/mittBus';

const logs = ref<Api.Websocket.LogInfo[]>([]);
const searchText = ref('');
const autoScroll = ref(true);

// 滚动到底部
const scrollToBottom = () => {
  nextTick(() => {
    const container = document.querySelector('.log-container');
    if (container) {
      container.scrollTop = container.scrollHeight;
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
      <NSpace align="center" :size="12">
        <NInput v-model:value="searchText" placeholder="搜索日志..." clearable class="search-input">
          <template #prefix>
            <icon-el:search />
          </template>
        </NInput>

        <NButton size="small" class="clear-btn" @click="clearLogs">
          <template #icon><icon-heroicons-outline:archive-box-x-mark /></template>
          清空
        </NButton>

        <NSwitch v-model:value="autoScroll" size="small">
          <template #checked>自动滚动</template>
          <template #unchecked>手动滚动</template>
        </NSwitch>
      </NSpace>
    </div>

    <!-- 日志内容区域 -->
    <NScrollbar class="log-container">
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
  border-radius: 4px;
  overflow: hidden;
}

.toolbar {
  padding: 8px 12px;
  background-color: #252526;
  border-bottom: 1px solid #333;
}

.log-container {
  flex: 1;
  padding: 8px 0;
}

.log-content {
  padding: 0 12px;
}

.log-item {
  display: flex;
  align-items: center;
  padding: 4px 0;
  font-size: 13px;
  line-height: 1.5;
  border-bottom: 1px solid #2d2d2d;
}

.log-time {
  color: #858585;
  min-width: 80px;
  margin-right: 12px;
}

.log-type {
  min-width: 50px;
  margin-right: 12px;
  text-align: center;
  font-size: 11px;
  font-weight: bold;
}

.log-message {
  flex: 1;
  word-break: break-word;
}

.empty-tip {
  padding: 20px;
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

.search-input {
  width: 200px;
}

.clear-btn {
  margin-left: 8px;
  color: #fff;
}
</style>
