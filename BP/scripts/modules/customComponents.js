import { world, system } from "@minecraft/server";
const ItemFoodEffectsComponent = {
  onConsume({ source }, { params }) {
    // Iterates over each object in the component's array.
    for (const { name, duration = 1, amplifier = 1 } of params) {
      source.addEffect(name, duration, { amplifier });
    }
  },
};

system.beforeEvents.startup.subscribe(({ itemComponentRegistry }) => {
  // Register the custom component for use in the item JSON file:
  itemComponentRegistry.registerCustomComponent(
    "vp:food_effects",
    ItemFoodEffectsComponent,
  );
});
