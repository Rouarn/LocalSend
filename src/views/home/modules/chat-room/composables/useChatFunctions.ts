import { onMounted, onUnmounted, ref } from 'vue';

export function useChatFunctions() {
  const showEmojiPopover = ref(false);
  const showMoreFunction = ref(false);

  const reset = async () => {
    showMoreFunction.value = false;
    setTimeout(() => {
      showEmojiPopover.value = false;
    }, 200);
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      reset();
    }
    if (e.key === 'Enter') {
      reset();
    }
  };

  onMounted(() => {
    window.addEventListener('keydown', handleKeyDown);
  });

  onUnmounted(() => {
    window.removeEventListener('keydown', handleKeyDown);
  });

  return {
    showEmojiPopover,
    showMoreFunction,
    reset
  };
}
