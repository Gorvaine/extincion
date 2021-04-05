import { EXTINCION } from '../config.js'

/**
 * Extend the basic ActorSheet with some very simple modifications
 * @extends {ActorSheet}
 */
export class extincionActorSheet extends ActorSheet {

  /** @override */
  static get defaultOptions() {
    return mergeObject(super.defaultOptions, {
      classes: ["extincion", "sheet", "actor", "human"],
      template: "systems/extincion/templates/actor/actor-sheet.html",
      width: 600,
      height: 800,
      tabs: [{ navSelector: ".sheet-tabs", contentSelector: ".sheet-body", initial: "items" }]
    });
  }

  /* -------------------------------------------- */

  /** @override */
  getData() {
    const data = super.getData();
    data.dtypes = ["String", "Number", "Boolean"];
    for (let attr of Object.values(data.data.attributes)) {
      attr.isCheckbox = attr.dtype === "Boolean";
    }
    for (let [key, abil] of Object.entries(data.data.abilities)) {
      abil.label = game.i18n.localize(EXTINCION.abilities[key])
      abil.key = key
    }
    return data;
  }

  /** @override */
  activateListeners(html) {
    super.activateListeners(html);

    // Everything below here is only needed if the sheet is editable
    if (!this.options.editable) return;

    // Add Inventory Item
    html.find('.item-create').click(this._onItemCreate.bind(this));

    // Update Inventory Item
    html.find('.item-edit').click(ev => {
      const li = $(ev.currentTarget).parents(".item");
      const item = this.actor.getOwnedItem(li.data("itemId"));
      item.sheet.render(true);
    });

    // Delete Inventory Item
    html.find('.item-delete').click(ev => {
      const li = $(ev.currentTarget).parents(".item");
      this.actor.deleteOwnedItem(li.data("itemId"));
      li.slideUp(200, () => this.render(false));
    });

    // Rollable abilities.
    html.find('.tomsg').click(this._toMsg.bind(this));

    html.find('.rollable').click(this._onRoll.bind(this));

    html.find('button').click(this._onButton.bind(this, html));

  }

  /* -------------------------------------------- */

  /**
   * Handle creating a new Owned Item for the actor using initial data defined in the HTML dataset
   * @param {Event} event   The originating click event
   * @private
   */
  _onItemCreate(event, html) {
    event.preventDefault();
    const header = event.currentTarget;
    // Get the type of item to create.
    const type = header.dataset.type;
    // Grab any data associated with this control.
    const data = duplicate(header.dataset);
    // Initialize a default name.
    const name = `New ${type.capitalize()}`;
    // Prepare the item object.
    const itemData = {
      name: name,
      type: type,
      data: data
    };
    // Remove the type from the dataset since it's in the itemData.type prop.
    delete itemData.data["type"];

    // Finally, create the item!
    return this.actor.createOwnedItem(itemData);
  }

  /**
   * Handle clickable rolls.
   * @param {Event} event   The originating click event
   * @private
   */


  _onButton(_html, event) {

    console.log("botón apretado!")

    if (event.target.className === "") {
      event.target.className = "active";
      if (event.target.id == "adv") {
        // Si el otro botón (desventaja) está apretado, lo quitamos.
        if ($('#dis')[0].className == "active") $('#dis')[0].className = ""

        $('.ability.rollable').attr("data-roll", "2d20kl");
      } else {
        if ($('#adv')[0].className == "active") $('#adv')[0].className = ""
        $('.ability.rollable').attr("data-roll", "2d20kh");
      }
    } else {

      event.target.className = "";
      $('.ability.rollable').attr("data-roll", "d20");
    }
  }

  _toMsg(event) {

  }

  _onRoll(event) {
    event.preventDefault();
    const element = event.currentTarget;
    const dataset = element.dataset;

    // if (dataset.roll) {
    //   let roll = new Roll(dataset.roll, this.actor.data.data);
    //   let label = dataset.label ? `${game.i18n.localize("EXTINCION.rolling")} ${dataset.label}` : '';
    //   roll.roll().toMessage({
    //     speaker: ChatMessage.getSpeaker({ actor: this.actor }),
    //     flavor: label
    //   });
    // }
    if (dataset.roll) {
      let cnt = [dataset.label, this.actor.id];
      let roll
      let prepflavor
      let flavor
      roll = new Roll(dataset.roll, this.actor.data.data).roll();

      // Preparamos el flavor del mensaje

      if (cnt[0].includes("usedice")) {
        let itemid = cnt[0].split(" ")[1];
        flavor = `${game.i18n.localize("EXTINCION.userolling")} <b>${this.actor.items.get(itemid).name}</b>`;
      } else if (cnt[0] === "damagemin") {
        flavor = `${game.i18n.localize("EXTINCION.rolling")} <b>${game.i18n.localize("EXTINCION.DamageUnarmed")}</b>`;
      } else if (cnt[0] === "damageval") {
        flavor = `${game.i18n.localize("EXTINCION.rolling")} <b>${game.i18n.localize("EXTINCION.DamageArmed")}</b>`;
      } else {
        prepflavor = `${EXTINCION.abilities[dataset.label]}`;
        flavor = `${game.i18n.localize("EXTINCION.rolling")}<b>${game.i18n.localize(prepflavor)}</b>`
      }


      // Añadimos el mensaje de tirada con ventaja!
      if ((typeof(prepflavor) != 'undefined') && ($('#adv')[0].className == "active")) {
        flavor = `${game.i18n.localize("EXTINCION.adv")} - ${flavor}`;
      } else if ($('#dis')[0].className == "active") {
        flavor = `${game.i18n.localize("EXTINCION.dis")} - ${flavor}`;
      }

      // Desmarcamos la ventaja/desventaja Esto debería ser personalizable en settup.
      // TODO <-<-<-<-<-<< DEBERÍA SER PERSONALIZABLE EN SETUP!!!
      $('#adv')[0].className = "";
      $('#dis')[0].className = "";
      $('.ability.rollable').attr("data-roll", "d20");

      let msg = {
        user: game.userId,
        type: CHAT_MESSAGE_TYPES.ROLL,
        roll: roll,
        rollMode: game.settings.get("core", "rollMode"),
        actor: this.actor,
        content: cnt,
        flavor: flavor
      };
      ChatMessage.create(msg);
    }
  }
}