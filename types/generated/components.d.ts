import type { Schema, Attribute } from '@strapi/strapi';

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
      'recipe.single-ingredient': RecipeSingleIngredient;
    }
  }
}
