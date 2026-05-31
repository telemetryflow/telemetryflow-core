/**
 * Test untuk memastikan isolasi tab di ChatBox
 * BUGFIX: Chat dari tab sebelumnya tidak boleh masuk ke tab baru
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useLLMStore } from '../llm';

describe('LLM Store - Tab Isolation', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('should create tabs with unique conversationUuid', () => {
    const store = useLLMStore();
    
    // Initialize tabs
    store.initializeTabs();
    const tab1Id = store.activeTabId;
    const tab1 = store.chatTabs.find(t => t.id === tab1Id);
    
    // Create second tab
    const tab2Id = store.createNewTab();
    const tab2 = store.chatTabs.find(t => t.id === tab2Id);
    
    // Verify both tabs exist
    expect(tab1).toBeDefined();
    expect(tab2).toBeDefined();
    
    // Verify unique conversationUuid
    expect(tab1?.conversationUuid).toBeDefined();
    expect(tab2?.conversationUuid).toBeDefined();
    expect(tab1?.conversationUuid).not.toBe(tab2?.conversationUuid);
  });

  it('should isolate conversations between tabs', () => {
    const store = useLLMStore();
    
    // Initialize and get first tab
    store.initializeTabs();
    const tab1Id = store.activeTabId!;
    
    // Simulate conversation in tab 1
    store.activeConversation = {
      id: 'conv-1',
      title: 'Tab 1 Conversation',
      contextType: 'dashboard',
      messageCount: 2,
      totalTokensUsed: 100,
      lastMessageAt: new Date().toISOString(),
      isArchived: false,
      createdAt: new Date().toISOString(),
      messages: [
        {
          id: 'msg-1',
          role: 'user',
          content: 'Hello from tab 1',
          createdAt: new Date().toISOString(),
        },
        {
          id: 'msg-2',
          role: 'assistant',
          content: 'Response in tab 1',
          createdAt: new Date().toISOString(),
        },
      ],
    };
    
    // Create second tab
    const tab2Id = store.createNewTab();
    
    // Verify tab 2 has empty conversation
    expect(store.activeConversation).toBeNull();
    expect(store.activeTabId).toBe(tab2Id);
    
    // Switch back to tab 1
    store.switchTab(tab1Id);
    
    // Verify tab 1 still has its conversation
    expect(store.activeConversation).not.toBeNull();
    expect(store.activeConversation?.messages.length).toBe(2);
    expect(store.activeConversation?.messages[0].content).toBe('Hello from tab 1');
  });

  it('should not share conversation references between tabs', () => {
    const store = useLLMStore();
    
    // Initialize tabs
    store.initializeTabs();
    const tab1Id = store.activeTabId!;
    
    // Add conversation to tab 1
    store.activeConversation = {
      id: 'conv-1',
      title: 'Original',
      contextType: 'dashboard',
      messageCount: 1,
      totalTokensUsed: 50,
      lastMessageAt: new Date().toISOString(),
      isArchived: false,
      createdAt: new Date().toISOString(),
      messages: [
        {
          id: 'msg-1',
          role: 'user',
          content: 'Original message',
          createdAt: new Date().toISOString(),
        },
      ],
    };
    
    // Create tab 2 and add different conversation
    const tab2Id = store.createNewTab()!;
    store.activeConversation = {
      id: 'conv-2',
      title: 'Different',
      contextType: 'logs',
      messageCount: 1,
      totalTokensUsed: 30,
      lastMessageAt: new Date().toISOString(),
      isArchived: false,
      createdAt: new Date().toISOString(),
      messages: [
        {
          id: 'msg-2',
          role: 'user',
          content: 'Different message',
          createdAt: new Date().toISOString(),
        },
      ],
    };
    
    // Switch back to tab 1
    store.switchTab(tab1Id);
    
    // Verify tab 1 conversation is not affected by tab 2
    expect(store.activeConversation?.id).toBe('conv-1');
    expect(store.activeConversation?.messages[0].content).toBe('Original message');
    expect(store.activeConversation?.contextType).toBe('dashboard');
    
    // Switch to tab 2
    store.switchTab(tab2Id);
    
    // Verify tab 2 has its own conversation
    expect(store.activeConversation?.id).toBe('conv-2');
    expect(store.activeConversation?.messages[0].content).toBe('Different message');
    expect(store.activeConversation?.contextType).toBe('logs');
  });

  it('should reset conversation only for active tab when starting new conversation', () => {
    const store = useLLMStore();
    
    // Setup two tabs with conversations
    store.initializeTabs();
    const tab1Id = store.activeTabId!;
    store.activeConversation = {
      id: 'conv-1',
      title: 'Tab 1',
      contextType: 'dashboard',
      messageCount: 1,
      totalTokensUsed: 50,
      lastMessageAt: new Date().toISOString(),
      isArchived: false,
      createdAt: new Date().toISOString(),
      messages: [{ id: 'msg-1', role: 'user', content: 'Tab 1 message', createdAt: new Date().toISOString() }],
    };
    
    const tab2Id = store.createNewTab()!;
    store.activeConversation = {
      id: 'conv-2',
      title: 'Tab 2',
      contextType: 'logs',
      messageCount: 1,
      totalTokensUsed: 30,
      lastMessageAt: new Date().toISOString(),
      isArchived: false,
      createdAt: new Date().toISOString(),
      messages: [{ id: 'msg-2', role: 'user', content: 'Tab 2 message', createdAt: new Date().toISOString() }],
    };
    
    // Start new conversation in tab 2
    store.startNewConversation();
    
    // Verify tab 2 conversation is reset
    expect(store.activeConversation).toBeNull();
    
    // Switch to tab 1
    store.switchTab(tab1Id);
    
    // Verify tab 1 conversation is NOT affected
    expect(store.activeConversation).not.toBeNull();
    expect(store.activeConversation?.messages[0].content).toBe('Tab 1 message');
  });

  it('should generate unique UUIDs for each tab', () => {
    const store = useLLMStore();
    
    // Create multiple tabs
    store.initializeTabs();
    store.createNewTab();
    store.createNewTab();
    store.createNewTab();
    
    // Collect all conversationUuids
    const uuids = store.chatTabs.map(t => t.conversationUuid);
    
    // Verify all UUIDs are unique
    const uniqueUuids = new Set(uuids);
    expect(uniqueUuids.size).toBe(uuids.length);
    
    // Verify UUID format
    uuids.forEach(uuid => {
      expect(uuid).toMatch(/^conv-\d+-[a-f0-9-]+$/);
    });
  });
});
