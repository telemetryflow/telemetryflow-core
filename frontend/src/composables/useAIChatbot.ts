import { ref } from "vue";

const isChatbotOpen = ref(false);

export function useAIChatbot() {
  function openChatbot() {
    isChatbotOpen.value = true;
  }

  function closeChatbot() {
    isChatbotOpen.value = false;
  }

  function toggleChatbot() {
    isChatbotOpen.value = !isChatbotOpen.value;
  }

  return {
    isChatbotOpen,
    openChatbot,
    closeChatbot,
    toggleChatbot,
  };
}
