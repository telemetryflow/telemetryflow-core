<script setup lang="ts">
import ErrorPage from "./ErrorPage.vue";
</script>

<template>
  <ErrorPage
    code="404"
    title="Page Not Found"
    description="The page you're looking for doesn't exist or has been moved."
    icon="carbon:warning-alt"
    gradient="linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)"
  />
</template>
