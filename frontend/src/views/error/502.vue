<script setup lang="ts">
import ErrorPage from "./ErrorPage.vue";
</script>

<template>
  <ErrorPage
    code="502"
    title="Bad Gateway"
    description="The server received an invalid response from an upstream server. Please try again later."
    icon="carbon:connection-signal-off"
    gradient="linear-gradient(135deg, #f97316 0%, #ea580c 100%)"
  />
</template>
