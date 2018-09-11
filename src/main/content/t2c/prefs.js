/**
 * Author: Davide Ficano
 * Date  : 26-Dec-05
 */

const T2CLIP_ROW_SEP        = "rowSep";
const T2CLIP_COL_SEP        = "colSep";
const T2CLIP_ROW_SEP_ATEND  = "rowSepAtEnd";

function Table2ClipFormat() {
}

Table2ClipFormat.prototype = {
    get rowSep() {
        return this._rowSep;
    },

    set rowSep(v) {
        this._rowSep = v;
    },

    get columnSep() {
        return this._columnSep;
    },

    set columnSep(v) {
        this._columnSep = v;
    },

    get appendRowSepAtEnd() {
        return this._appendRowSepAtEnd;
    },

    set appendRowSepAtEnd(b) {
        this._appendRowSepAtEnd = b;
    }
};

function Table2ClipPrefs() {
    this.prefBranch = browser.storage.local;

    this.format = new Table2ClipFormat();
}

Table2ClipPrefs.prototype = {
    getString : function(prefName, defValue) {
        return this.prefBranch.get({[prefName]: defValue});
    },

    getBool : function(prefName, defValue) {
        return this.prefBranch.get({[prefName]: defValue});
    },

    setString : function(prefName, prefValue) {
        this.prefBranch.set({[prefName]: prefValue});
    },

    setBool : function(prefName, prefValue) {
        this.prefBranch.set({[prefName]: prefValue});
    },

    getClipFormat : function() {
        var format = this.format;
        return Promise.all([
            this.getString(T2CLIP_ROW_SEP,
                            table2clipboard.common.newLine)
            .then((data) => {
                format.rowSep = data[Object.keys(data)[0]];
            }),
            this.getString(T2CLIP_COL_SEP, "\t")
            .then((data) => {
                format.columnSep = data[Object.keys(data)[0]];
            }),
            this.getBool(T2CLIP_ROW_SEP_ATEND, true)
            .then((data) => {
                format.appendRowSepAtEnd = data[Object.keys(data)[0]];
            })
        ]);
    },

    setClipFormat : function(format) {
        this.format = format;
    },

    savePrefs : function() {
        this.setString(T2CLIP_ROW_SEP, this.format.rowSep);
        this.setString(T2CLIP_COL_SEP, this.format.columnSep);
        this.setBool(T2CLIP_ROW_SEP_ATEND, this.format.appendRowSepAtEnd);
    }
};
