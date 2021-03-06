/**
 * Extend the basic ItemSheet with some very simple modifications
 * @extends {ItemSheet}
 */
export class extincionItemSheet extends ItemSheet {

    /** @override */
    static get defaultOptions() {
        return mergeObject(super.defaultOptions, {
            classes: ["extincion", "sheet", "item"],
            width: 520,
            height: 480,
            tabs: [{ navSelector: ".sheet-tabs", contentSelector: ".sheet-body", initial: "description" }]
        });
    }

    /** @override */
    get template() {
        const path = "systems/extincion/templates/item";
        // Return a single sheet for all item types.
        return `${path}/item-sheet.html`;
        // Alternatively, you could use the following return statement to do a
        // unique item sheet by type, like `weapon-sheet.html`.

        // return `${path}/${this.item.data.type}-sheet.html`;
    }

    /* -------------------------------------------- */

    /** @override */
    getData() {
        const data = super.getData();
        return data;
    }

    /* -------------------------------------------- */

    /** @override */
    setPosition(options = {}) {
        const position = super.setPosition(options);
        const sheetBody = this.element.find(".sheet-body");
        const bodyHeight = position.height - 192;
        sheetBody.css("height", bodyHeight);
        return position;
    }

    /* -------------------------------------------- */

    /** @override */
    activateListeners(html) {
        super.activateListeners(html);

        // Everything below here is only needed if the sheet is editable
        if (!this.options.editable) return;

        // Roll handlers, click handlers, etc. would go here.
        html.find('.rollable').click(this._onRoll.bind(this));
    }

    _onRoll(event) {
        event.preventDefault();
        const element = event.currentTarget;
        const dataset = element.dataset;

        if (dataset.roll) {
            let roll = new Roll(dataset.roll, this.item.data.data).roll();
            let cnt = dataset.label;
            let prepflavor = `${"EXTINCION.userolling"}${this.item.name}`;
            let msg = {
                user: game.userId,
                type: CHAT_MESSAGE_TYPES.ROLL,
                roll: roll,
                rollMode: game.settings.get("core", "rollMode"),
                actor: game.actors.get(this.actor),
                content: cnt,
                flavor: `${game.i18n.localize("EXTINCION.userolling")} ${this.item.name}`
            };
            ChatMessage.create(msg);
        }
    }
}