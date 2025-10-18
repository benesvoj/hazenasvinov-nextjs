import React from 'react';

import {ActionsProps} from '@/types';

/**
 * Props for AdminContainer component.
 *
 * Can be used in two modes:
 * 1. Without tabs: Renders children directly with global actions/filters
 * 2. With tabs: Renders tab navigation, each tab can have its own actions/filters
 */
export interface AdminContainerProps<T extends readonly TabConfig[] = TabConfig[]> {
  /** Page title */
  title?: string;
  /** Page description */
  description?: string;
  /** Icon for the page header */
  icon?: React.ReactNode;
  /**
   * Content to render when not using tabs.
   * Ignored when tabs are provided.
   */
  children?: React.ReactNode;
  /** Show loading spinner instead of content */
  loading?: boolean;
  /**
   * Global actions shown when no tabs are used.
   * When tabs exist, each tab can:
   * - Override with its own actions
   * - Inherit these global actions (inheritGlobalActions: true)
   * - Show no actions
   */
  actions?: ActionsProps[];
  /**
   * Global filters shown when no tabs are used.
   * When tabs exist, each tab can:
   * - Override with its own filters
   * - Inherit these global filters (inheritGlobalFilters: true)
   * - Show no filters
   */
  filters?: React.ReactNode;
  /**
   * Tab configuration. If provided, children is ignored and tabs are rendered instead.
   */
  tabs?: TabConfig[];
  /**
   * Currently active tab key.
   * Defaults to first tab's key if not provided.
   */
  activeTab?: T[number]['key'];
  /** Callback when active tab changes */
  onTabChange?: (key: T[number]['key']) => void;
  /** Aria label for tab navigation (accessibility) */
  tabsAriaLabel?: string;
}

/**
 * Configuration for a single tab in AdminContainer.
 *
 * Each tab can either:
 * 1. Define its own actions/filters
 * 2. Inherit global actions/filters from AdminContainer
 * 3. Show no actions/filters
 *
 * Note: If both `actions` and `inheritGlobalActions` are provided,
 * `inheritGlobalActions` takes precedence.
 */
export interface BaseTabConfig {
  /** Unique identifier for the tab */
  key: string;
  /** Display title of the tab */
  title: string;
  /** Content to render when tab is active */
  content: React.ReactNode;
}

export interface TabWithOwnActions extends BaseTabConfig {
  actions?: ActionsProps[];
  filters?: React.ReactNode;
  inheritGlobalActions?: never; // Forbidden
  inheritGlobalFilters?: never;
}

export interface TabWithInheritedActions extends BaseTabConfig {
  actions?: never; // Forbidden
  filters?: never;
  inheritGlobalActions?: boolean;
  inheritGlobalFilters?: boolean;
}

export interface TabWithMixedConfig extends BaseTabConfig {
  actions?: ActionsProps[];
  filters?: React.ReactNode;
  inheritGlobalActions?: boolean;
  inheritGlobalFilters?: boolean;
}

export type TabConfig = TabWithOwnActions | TabWithInheritedActions | TabWithMixedConfig;
