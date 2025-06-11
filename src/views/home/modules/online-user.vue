<script setup lang="ts">
import { NAvatar, NList, NListItem, NText } from 'naive-ui';
import { useSocket } from '@/hooks/business/useSocket';
import Avatar from '@/assets/imgs/soybean.jpg';

const { listen, emit, connected } = useSocket();

// 监听消息
listen<{ message: string }>('online', data => {
  console.log('Received message:', data.message);
});

// 发送消息
const sendMessage = () => {
  console.log('Sending message...');
  emit('createWebsocket', { text: 'Hello from client' });
};

const onlineUser = [
  {
    id: 1,
    title: '张三',
    ip: '192.168.1.1'
  },
  {
    id: 2,
    title: '李四',
    ip: '192.168.1.2'
  }
];
</script>

<template>
  <NList hoverable clickable>
    <NListItem v-for="item in onlineUser" :key="item.id" class="flex items-center justify-center">
      <template #prefix>
        <NFlex align="center" justify="center">
          <NAvatar size="large" :src="Avatar" round />
        </NFlex>
      </template>
      <div class="ml-12px">
        <NText>{{ item.title }}</NText>
        <NText>{{ item.ip }}</NText>
        {{ connected ? '在线' : '离线' }}
      </div>

      <template #suffix>
        <NIconWrapper :size="24" :border-radius="10" @click="sendMessage">
          <!--          <NIcon :size="18" :component="" />-->
        </NIconWrapper>
      </template>
    </NListItem>
  </NList>
</template>
