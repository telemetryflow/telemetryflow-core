<script setup lang="ts">
import ErrorPage from "./ErrorPage.vue";
</script>

<template>
  <ErrorPage
    code="403"
    title="Forbidden"
    description="You don't have permission to access this resource. Contact your administrator if you believe this is an error."
    icon="carbon:block"
    gradient="linear-gradient(135deg, #ef4444 0%, #dc2626 100%)"
  />
</template>
