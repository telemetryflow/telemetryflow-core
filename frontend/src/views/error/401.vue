<script setup lang="ts">
import ErrorPage from "./ErrorPage.vue";
</script>

<template>
  <ErrorPage
    code="401"
    title="Unauthorized"
    description="You need to be authenticated to access this resource. Please log in and try again."
    icon="carbon:locked"
    gradient="linear-gradient(135deg, #f59e0b 0%, #ef4444 100%)"
  />
</template>
