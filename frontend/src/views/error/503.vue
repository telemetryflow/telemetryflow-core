<script setup lang="ts">
import ErrorPage from "./ErrorPage.vue";
</script>

<template>
  <ErrorPage
    code="503"
    title="Service Unavailable"
    description="The service is temporarily unavailable due to maintenance or overload. Please try again later."
    icon="carbon:time"
    gradient="linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)"
  />
</template>
