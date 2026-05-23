<script setup lang="ts">
import ErrorPage from "./ErrorPage.vue";
</script>

<template>
  <ErrorPage
    code="500"
    title="Internal Server Error"
    description="Something went wrong on our end. Please try again later or contact support if the problem persists."
    icon="carbon:cloud-offline"
    gradient="linear-gradient(135deg, #dc2626 0%, #991b1b 100%)"
  />
</template>
