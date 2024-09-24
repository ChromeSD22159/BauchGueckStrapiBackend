import type { Schema, Attribute } from '@strapi/strapi';

export interface SharedChangeLogItem extends Schema.Component {
  collectionName: 'components_shared_change_log_items';
  info: {
    displayName: 'ChangeLogItem';
  };
  attributes: {
    value: Attribute.String;
  };
}

export interface RecipeSingleIngredient extends Schema.Component {
  collectionName: 'components_recipe_single_ingredients';
  info: {
    displayName: 'Single Ingredient';
    icon: 'alien';
    description: '';
  };
  attributes: {
    name: Attribute.String;
    amount: Attribute.String;
    unit: Attribute.String;
  };
}

declare module '@strapi/types' {
  export module Shared {
    export interface Components {
      'shared.change-log-item': SharedChangeLogItem;
      'recipe.single-ingredient': RecipeSingleIngredient;
    }
  }
}
