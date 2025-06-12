<script setup lang="ts">
import OnlineUser from '@/views/home/modules/online-user.vue';
</script>

<template>
  <NLayout class="h-full" content-class="w-full flex flex-col">
    <NLayout has-sider class="flex-1" content-class="w-full h-full">
      <NLayoutSider :native-scrollbar="false" bordered content-class="w[calc(100%-40px)] pa-20px h-full">
        <OnlineUser />
      </NLayoutSider>
      <NLayout content-class="flex flex-col">
        <NLayoutHeader class="h-5rem flex items-center justify-center text-10 font-900" bordered>
          LocalSend
        </NLayoutHeader>

        <NLayoutContent class="flex-1 pa-20px text-xs">
          经过上述讨论, 这种事实对本人来说意义重大, 相信对这个世界也是有一定意义的.在这种困难的抉择下, 本人思来想去,
          寝食难安.问题的关键究竟为何? 这样看来, 我们都知道, 只要有意义, 那么就必须慎重考虑.
          随机一段废话似乎是一种巧合，但如果我们从一个更大的角度看待问题，这似乎是一种不可避免的事实. 那么,
          带着这些问题, 我们来审视一下随机一段废话. 我们不妨可以这样来想: 随机一段废话因何
        </NLayoutContent>
      </NLayout>
    </NLayout>
    <NLayoutFooter bordered class="h-xs pa-20px lt-lg:h-8rem">城府路</NLayoutFooter>
  </NLayout>
</template>

<style lang="scss" scoped></style>
