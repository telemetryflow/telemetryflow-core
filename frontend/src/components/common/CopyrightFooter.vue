<script setup lang="ts">
/**
 * Copyright Footer Component
 * Displays white-labeled copyright and footer links
 */

import { Icon } from "@iconify/vue";
import { whiteLabelConfig, getCopyrightText } from "@/config/whitelabel";

interface Props {
  variant?: "default" | "minimal" | "full";
  showLinks?: boolean;
}

withDefaults(defineProps<Props>(), {
  variant: "default",
  showLinks: true,
});

const copyrightText = getCopyrightText();

const footerLinks = [
  { label: "Website", url: whiteLabelConfig.links.website, icon: "carbon:home" },
  { label: "Documentation", url: whiteLabelConfig.links.documentation, icon: "carbon:document" },
  { label: "Support", url: whiteLabelConfig.links.support, icon: "carbon:help" },
  { label: "Privacy", url: whiteLabelConfig.links.privacy, icon: "carbon:security" },
  { label: "Terms", url: whiteLabelConfig.links.terms, icon: "carbon:document-tasks" },
].filter(link => link.url); // Only show links that are configured
</script>

<template>
  <footer class="copyright-footer" :class="`copyright-footer--${variant}`">
    <!-- Minimal: Just copyright text -->
    <div v-if="variant === 'minimal'" class="footer-minimal">
      <span class="copyright-text">{{ copyrightText }}</span>
    </div>

    <!-- Default: Copyright + Links -->
    <div v-else-if="variant === 'default'" class="footer-default">
      <span class="copyright-text">{{ copyrightText }}</span>
      <div v-if="showLinks && footerLinks.length > 0" class="footer-links">
        <a
          v-for="link in footerLinks"
          :key="link.label"
          :href="link.url"
          target="_blank"
          rel="noopener noreferrer"
          class="footer-link"
        >
          {{ link.label }}
        </a>
      </div>
    </div>

    <!-- Full: Copyright + Links with Icons + Tagline -->
    <div v-else class="footer-full">
      <div class="footer-top">
        <div class="footer-brand">
          <span class="brand-name">{{ whiteLabelConfig.brandName }}</span>
          <span class="brand-tagline">{{ whiteLabelConfig.brandTagline }}</span>
        </div>
        <div v-if="showLinks && footerLinks.length > 0" class="footer-links-grid">
          <a
            v-for="link in footerLinks"
            :key="link.label"
            :href="link.url"
            target="_blank"
            rel="noopener noreferrer"
            class="footer-link-item"
          >
            <Icon :icon="link.icon" class="link-icon" />
            <span>{{ link.label }}</span>
          </a>
        </div>
      </div>
      <div class="footer-bottom">
        <span class="copyright-text">{{ copyrightText }}</span>
      </div>
    </div>
  </footer>
</template>

<style scoped lang="scss">
.copyright-footer {
  width: 100%;
  padding: 16px 24px;
  background: var(--n-card-color);
  border-top: 1px solid var(--n-border-color);
  
  :root.dark & {
    background: rgba(15, 23, 42, 0.8);
  }
}

.copyright-text {
  font-size: 0.75rem;
  color: var(--n-text-color-3);
  line-height: 1.5;
}

// Minimal variant
.footer-minimal {
  text-align: center;
}

// Default variant
.footer-default {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 16px;
  
  .footer-links {
    display: flex;
    gap: 16px;
    flex-wrap: wrap;
  }
  
  .footer-link {
    font-size: 0.75rem;
    color: var(--n-text-color-3);
    text-decoration: none;
    transition: color 0.2s ease;
    
    &:hover {
      color: var(--n-primary-color);
    }
  }
}

// Full variant
.footer-full {
  display: flex;
  flex-direction: column;
  gap: 20px;
  
  .footer-top {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 32px;
    flex-wrap: wrap;
  }
  
  .footer-brand {
    display: flex;
    flex-direction: column;
    gap: 4px;
    
    .brand-name {
      font-size: 1rem;
      font-weight: 600;
      color: var(--n-text-color);
    }
    
    .brand-tagline {
      font-size: 0.8125rem;
      color: var(--n-text-color-3);
    }
  }
  
  .footer-links-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
    gap: 12px;
  }
  
  .footer-link-item {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 6px 10px;
    border-radius: 6px;
    font-size: 0.8125rem;
    color: var(--n-text-color-2);
    text-decoration: none;
    transition: all 0.2s ease;
    
    .link-icon {
      font-size: 16px;
      color: var(--n-text-color-3);
      transition: color 0.2s ease;
    }
    
    &:hover {
      background: rgba(99, 102, 241, 0.08);
      color: var(--n-primary-color);
      
      .link-icon {
        color: var(--n-primary-color);
      }
    }
  }
  
  .footer-bottom {
    padding-top: 16px;
    border-top: 1px solid var(--n-border-color);
    text-align: center;
  }
}

// Responsive
@media (max-width: 768px) {
  .footer-default {
    flex-direction: column;
    text-align: center;
    
    .footer-links {
      justify-content: center;
    }
  }
  
  .footer-full {
    .footer-top {
      flex-direction: column;
      align-items: center;
      text-align: center;
    }
    
    .footer-links-grid {
      width: 100%;
      grid-template-columns: 1fr;
    }
  }
}
</style>
