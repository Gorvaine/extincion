// Import Modules
import { extincionActor } from "./actor/actor.js";
import { extincionActorSheet } from "./actor/actor-sheet.js";
import { extincionItem } from "./item/item.js";
import { extincionItemSheet } from "./item/item-sheet.js";

Hooks.once('init', async function() {

  game.extincion = {
    extincionActor,
    extincionItem
  };

  /**
   * Set an initiative formula for the system
   * @type {String}
   */
  CONFIG.Combat.initiative = {
    formula: "1d20",
    decimals: 2
  };

  // Define custom Entity classes
  CONFIG.Actor.entityClass = extincionActor;
  CONFIG.Item.entityClass = extincionItem;

  // Register sheet application classes
  Actors.unregisterSheet("core", ActorSheet);
  Actors.registerSheet("extincion", extincionActorSheet, { makeDefault: true });
  Items.unregisterSheet("core", ItemSheet);
  Items.registerSheet("extincion", extincionItemSheet, { makeDefault: true });

  // If you need to add Handlebars helpers, here are a few useful examples:
  Handlebars.registerHelper('concat', function() {
    var outStr = '';
    for (var arg in arguments) {
      if (typeof arguments[arg] != 'object') {
        outStr += arguments[arg];
      }
    }
    return outStr;
  });

  Handlebars.registerHelper('toLowerCase', function(str) {
    return str.toLowerCase();
  });
});

/**
 * Highlight critical success or failure on d20 rolls
 */
Hooks.on("renderChatMessage", (message, html, data) => {
  console.log("Mensaje hookeado!")
  if ( !message.isRoll ) return;
  let d20 = message.roll.parts[0].total;
  if ( d20 > 1 ) {
   html.find(".dice-total").addClass("success");
   html.find(".dice-formula").addClass("dice-tooltip");
   html.append("<div class=\"success\">Probando tirada</div>");
  }
  else if ( d20 === 1 ) html.find(".dice-total").addClass("failure");
});