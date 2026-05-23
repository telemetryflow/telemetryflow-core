<script setup lang="ts">
import ErrorPage from "./ErrorPage.vue";
</script>

<template>
  <ErrorPage
    code="504"
    title="Gateway Timeout"
    description="The server didn't respond in time. Please check your connection and try again."
    icon="carbon:hourglass"
    gradient="linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)"
  />
</template>
