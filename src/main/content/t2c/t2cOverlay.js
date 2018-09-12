/**
 * Author: Davide Ficano
 * Date  : 26-Dec-05
 */


var gTable2Clip = {
    _selectedTable : null,
    _tableUnderCursor : null,
    _popupNode : null,

    onLoad : function() {
        this.prefs = new Table2ClipPrefs();
        table2clipboard.builders.html.registerAllHandlers();

        window.addEventListener("contextmenu", function(event) {
            gTable2Clip._popupNode = event.target;
            gTable2Clip.setTableUnderCursor(event.target);
        }, true);
    },

    setTableUnderCursor : function (node) {
        gTable2Clip._tableUnderCursor = table2clipboard.tableInfo.findTableFromNode(node);
    },

    isOnTable : function () {
        return gTable2Clip._tableUnderCursor != null;
    },

    isOnCell : function () {
        return table2clipboard.tableInfo.getCellNode(gTable2Clip._popupNode) != null;
    },

    copyTableSelection : function(event) {
        try {
            var arr;

            if (this._selectedTable) {
                arr = table2clipboard.tableInfo.getTableInfoFromTable(this._selectedTable);
            } else {
                var sel = window.getSelection();
                // if it isn't called from context menu _tableUnderCursor is null
                arr = table2clipboard.tableInfo.getTableInfoFromSelection(sel, this._tableUnderCursor);
            }
            this.copyToClipboard(arr);
        } catch (err) {
            table2clipboard.common.logException(err, "T2C copyTableSelection: ");
        }
    },

    copyAllTables : function() {
        var doc = document.commandDispatcher.focusedWindow.content.document;
        var tables = table2clipboard.tableInfo.getRootTables(doc, doc.body);
        var tableInfos = [];

        for (var i in tables) {
            tableInfos.push(table2clipboard.tableInfo.getTableInfoFromTable(tables[i]));
        }
        this.copyToClipboard(tableInfos);
    },

    copyToClipboard : function(tableInfo, event) {
        // Overwrite the clipboard content.
        event.preventDefault();
        with (table2clipboard.formatters) {
            var textHtml = html.format(tableInfo, this.prefs.htmlOptions);
            var textCSV = csv.format(tableInfo, this.prefs.format);
        }
        event.clipboardData.setData("text/plain", textCSV);
        event.clipboardData.setData("text/html", textHtml);
    },

    // From browser.js
    // Returns true if anything is selected.
    isContentSelection : function(sel) {
        return !sel.isCollapsed;
    },

    isTableSelection : function(node) {
        this._selectedTable = null;
        var nodeName = node.nodeName && node.nodeName.toLowerCase();

        if (nodeName == "tr" || nodeName == "th") {
            return true;
        }

        if (nodeName == "table") {
            this._selectedTable = node;
            return true;
        }
        var nl = node.childNodes;
        for (var i = 0; i < nl.length; i++) {
            if (node.nodeName.toLowerCase() == "table") {
                this._selectedTable = nl[i];
                return true;
            }
        }

        return false;
    },

    selectTable : function(table) {
        table = typeof(table) == "undefined" || table == null
            ? this._tableUnderCursor : table;
        if (table) {
            var focusedWindow = window;
            var sel = focusedWindow.getSelection();
            sel.selectAllChildren(table);
        }
    },

    copyWholeTable : function(table) {
        var self = this;
        function oncopy(event) {
            document.removeEventListener("copy", oncopy, true);
            // Hide the event from the page to prevent tampering.
            event.stopImmediatePropagation();

            table = typeof(table) == "undefined" || table == null
                ? self._tableUnderCursor : table;
            try {
                var arr = table2clipboard.tableInfo.getTableInfoFromTable(table);
                self.copyToClipboard(arr, event);
            } catch (err) {
                table2clipboard.common.logException(err, "T2C copyWholeTable: ");
            }
        }
        document.addEventListener("copy", oncopy, true);

        Promise.all([
            this.prefs.getClipFormat(),
            this.prefs.getHtmlOptions()
        ]).then(() => {
            // Requires the clipboardWrite permission, or a user gesture:
            document.execCommand("copy");
        });
    },

    copySelectedCells : function() {
        var self = this;
        function oncopy(event) {
            document.removeEventListener("copy", oncopy, true);
            // Hide the event from the page to prevent tampering.
            event.stopImmediatePropagation();
            if (self.hasSelectedCells()) {
                self.copyTableSelection();
            }
        }
        document.addEventListener("copy", oncopy, true);

        Promise.all([
            this.prefs.getClipFormat(),
            this.prefs.getHtmlOptions()
        ]).then(() => {
            // Requires the clipboardWrite permission, or a user gesture:
            document.execCommand("copy");
        });
    },

    hasSelectedCells : function() {
        var focusedWindow = window;
        if (focusedWindow) {
            var sel = focusedWindow.getSelection();
            return this.isContentSelection(sel)
                     && this.isTableSelection(sel.focusNode);
        }
        return false;
    },

    selectTableRow : function() {
        // get node under mouse pointer
        var tr = table2clipboard.tableInfo.getAncestorByTagName(gTable2Clip._popupNode, "tr");

        if (tr) {
            var sel = window.getSelection();
            table2clipboard.tableInfo.selectCells(sel, tr.cells);
        }
    },

    selectTableColumn : function() {
        var sel = window.getSelection();
        var cells = table2clipboard.tableInfo.getTableColumnsByNode(gTable2Clip._popupNode);
        table2clipboard.tableInfo.selectCells(sel, cells);
    },

    onOpenSettings : function(event) {
        toOpenWindowByType("t2c:settings",
                           "chrome://t2c/content/settings/settings.xul",
                           "chrome,resizable=yes,dependent=yes");
    }
}
