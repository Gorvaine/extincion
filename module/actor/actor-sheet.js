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
  async getData() {
    const data = super.getData().data;
    for (let [key, abil] of Object.entries(data.system.abilities)) {
      abil.label = game.i18n.localize(EXTINCION.abilities[key])
      abil.key = key
    }
    data.system["totalAP"] = this._totalAP;
    data.system["totalWeight"] = this._totalWeight;
    data.system["enrichedBiography"] = await TextEditor.enrichHTML(data.system.biography, {async: true});
    return data;
  }

  /** @override */
  activateListeners(html) {
    super.activateListeners(html);

    // Everything below here is only needed if the sheet is editable
    if (!this.options.editable) return;

    // Equip Item
    html.find('.item-equip').click(ev => {
      const li = ev.currentTarget.dataset["itemId"];
      const item = this.actor.items.get(li);
      item.update({ 'data.equipped': !item.data.system.equipped });
    });

    // Add Inventory Item
    html.find('.item-create').click(this._onItemCreate.bind(this));

    // Update Inventory Item
    html.find('.item-edit').click(ev => {
      const li = $(ev.currentTarget).parents(".item");
      const item = this.actor.items.get(li.data("itemId"));
      item.sheet.render(true);
    });

    // Delete Inventory Item
    html.find('.item-delete').click(ev => {
      const li = $(ev.currentTarget).parents(".item");
      this.actor.deleteEmbeddedDocuments("Item",[li.data("itemId")]);
      li.slideUp(200, () => this.render(false));
    });

    // Chat message?

    html.find('.tomsg').click(this._toMsg.bind(this));

    // Rollable abilities.

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
    return this.actor.createEmbeddedDocuments("Item" ,[itemData]);
  }

  /**
   * Handle clickable rolls.
   * @param {Event} event   The originating click event
   * @private
   */


  _onButton(_html, event) {

    // console.log("botón apretado!")

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

    event.preventDefault();
    const element = event.currentTarget;
    const dataset = element.dataset;

    if (dataset.roll) return;

    if (!(dataset["itemId"] === 'undefined')) {

      let item = this.actor.items.get(dataset["itemId"]);

      let msg = {
        user: game.userId,
        type: CONST.CHAT_MESSAGE_TYPES.OTHER,
        actor: this.actor,
        content: `${item.data.system.properties} `, // Espacio es un truco por si no tienen properties que salga igual el mensaje.
        flavor: `<div class="align-center item-flavor"><img width=32px src=${item.img}><span class="text">${item.name}</span></div>`
      };
      ChatMessage.create(msg);

    }
  }

  async _onRoll(event) {
    event.preventDefault();
    const element = event.currentTarget;
    const dataset = element.dataset;

    // if (dataset.roll) {
    //   let roll = new Roll(dataset.roll, this.actor.data.system);
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
      roll = await new Roll(dataset.roll, this.actor.system).evaluate({ async: true });

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
        type: CONST.CHAT_MESSAGE_TYPES.ROLL,
        roll: roll,
        rollMode: game.settings.get("core", "rollMode"),
        speaker: {actor: this.actor},
        flags: {rolldata: cnt[0], actor: cnt[1]},
        flavor: flavor
      };
      ChatMessage.create(msg);
    }
  }
  _totalWeight() {
    let totalWeight = 0
    this.items.filter(i => typeof i.system.weight !== "undefined").forEach(i => totalWeight += i.system.weight)
    return totalWeight
  }

  _totalAP() {
    let totalAP = 0
    this.items.filter(i => (typeof i.system.AP !== "undefined") && (i.system.equipped)).forEach(i => totalAP += i.system.AP)
    return totalAP
  }
}
