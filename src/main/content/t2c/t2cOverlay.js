/**
 * Author: Davide Ficano
 * Date  : 26-Dec-05
 */

var gTable2Clip = {
    _selectedTable : null,
    _tableUnderCursor : null,

    onLoad : function() {
        var thiz = gTable2Clip;

        thiz.addListeners();

        var obs = table2clipboard.common.getObserverService();
        obs.addObserver(thiz, "t2clip:update-config", false);
        obs.notifyObservers(null, "t2clip:update-config", "");

        table2clipboard.builders.html.registerAllHandlers();
    },

    onUnLoad : function() {
        var thiz = gTable2Clip;

        var obs = table2clipboard.common.getObserverService();
        obs.removeObserver(thiz, "t2clip:update-config");
        thiz.removeListeners();
    },

    observe : function(subject, topic, state) {
        var thiz = gTable2Clip;

        if (topic == "t2clip:update-config") {
            thiz.prefs = new Table2ClipPrefs();
            thiz.format = thiz.prefs.getClipFormat();
        }
    },

    addListeners : function() {
        var thiz = gTable2Clip;

        var menuItem = document.getElementById("context-t2c:Copy");
        if (menuItem) {
            var n = menuItem.parentNode;

            if (n) {
                n.addEventListener("popupshowing",
                                   thiz.onPopupShowingContextMenu, false);
            }
        }

        // don't use command dispatcher because the test routine can be slow
        // so call it directly only when menu is shown
        menuItem = document.getElementById("editMenu-t2c:CopyAllTables");
        if (menuItem) {
            var n = menuItem.parentNode;

            if (n) {
                n.addEventListener("popupshowing",
                                   thiz.onPopupShowingEdit, false);
            }
        }
    },

    removeListeners : function() {
        var thiz = gTable2Clip;

        var menuItem = document.getElementById("context-t2c:Copy");
        if (menuItem) {
            var n = menuItem.parentNode;

            if (n) {
                n.removeEventListener("popupshowing",
                                   thiz.onPopupShowingContextMenu, false);
            }
        }

        menuItem = document.getElementById("editMenu-t2c:CopyAllTables");
        if (menuItem) {
            var n = menuItem.parentNode;

            if (n) {
                n.removeEventListener("popupshowing",
                                   thiz.onPopupShowingEdit, false);
            }
        }
    },

    onPopupShowingContextMenu : function(event) {
        if (event.target == this) {
            gTable2Clip._tableUnderCursor = gTable2Clip.getTableUnderCursor();
            var isOnTable = gTable2Clip._tableUnderCursor != null;
            var hasCellsSelected = gTable2Clip.isCommandEnabled('cmd_copyT2C');

            gTable2Clip.showMenuItem("context-t2c:Copy", hasCellsSelected);
            gTable2Clip.showMenuItem("context-t2c:SelectTable", isOnTable);
            gTable2Clip.showMenuItem("context-t2c:CopyWholeTable", isOnTable);
            gTable2Clip.showMenuItem("context-t2c:SelectTableRow", isOnTable);
            gTable2Clip.showMenuItem("context-t2c:SelectTableColumn", isOnTable);

            // hide separators based on their sibling nodes
            var sepBeginPrev = document.getElementById("context-t2c:SepBegin").previousSibling;
            var sepEndNext = document.getElementById("context-t2c:SepEnd").nextSibling;
            var hasMenuBeforeBeginSep = sepBeginPrev && sepBeginPrev.localName != "menuseparator";
            var hasMenuAfterEndSep = sepEndNext && sepEndNext.localName != "menuseparator";
            var shouldShow = hasCellsSelected || isOnTable;
            gTable2Clip.showMenuItem("context-t2c:SepBegin", hasMenuBeforeBeginSep && shouldShow);
            gTable2Clip.showMenuItem("context-t2c:SepEnd", hasMenuAfterEndSep && shouldShow);
        }
        return true;
    },

    onPopupShowingEdit : function(event) {
        var doc = document.commandDispatcher.focusedWindow.content.document;
        var tables = table2clipboard.tableInfo.getRootTables(doc, doc.body);
        var menuitem = document.getElementById("editMenu-t2c:CopyAllTables");

        if (tables.length > 0) {
            var label = table2clipboard.common.getFormattedMessage(
                        "copy.all.tables.label", [tables.length]);
            menuitem.setAttribute("label", label);
        }
        gTable2Clip.showMenuItem(menuitem, tables.length > 0);
    },

    showMenuItem : function(menuItem, show) {
        if (menuItem.constructor === String) {
            menuItem = document.getElementById(menuItem);
        }
        if (show) {
            menuItem.removeAttribute("hidden");
        } else {
            menuItem.setAttribute("hidden", "true");
        }
    },

    goUpdateSelectMenuItems : function() {
        var thiz = gTable2Clip;
        goSetCommandEnabled("cmd_copyT2C", thiz.isCommandEnabled('cmd_copyT2C'));
    },

    copyTableSelection : function(event) {
        try {
            var arr;

            if (gTable2Clip._selectedTable) {
                arr = table2clipboard.tableInfo.getTableInfoFromTable(gTable2Clip._selectedTable);
            } else {
                var sel = document.commandDispatcher.focusedWindow.getSelection();
                // if it isn't called from context menu _tableUnderCursor is null
                arr = table2clipboard.tableInfo.getTableInfoFromSelection(sel, gTable2Clip._tableUnderCursor);
            }
            gTable2Clip.copyToClipboard(arr);
        } catch (err) {
            table2clipboard.common.log("T2C copyTableSelection: " + err);
        }
    },

    copyAllTables : function() {
        var doc = document.commandDispatcher.focusedWindow.content.document;
        var tables = table2clipboard.tableInfo.getRootTables(doc, doc.body);
        var tableInfos = [];

        for (var i in tables) {
            tableInfos.push(table2clipboard.tableInfo.getTableInfoFromTable(tables[i]));
        }
        gTable2Clip.copyToClipboard(tableInfos);
    },

    copyToClipboard : function(tableInfo) {
        with (table2clipboard.formatters) {
            var textHtml = html.format(tableInfo, gTable2Clip.getHtmlOptions());
            var textCSV = csv.format(tableInfo, gTable2Clip.format);
        }

        var xferable = Components.classes["@mozilla.org/widget/transferable;1"]
                        .createInstance(Components.interfaces.nsITransferable);

        xferable.addDataFlavor("text/html");
        var htmlstring = Components.classes["@mozilla.org/supports-string;1"]
                        .createInstance(Components.interfaces.nsISupportsString);
        htmlstring.data = textHtml;
        xferable.setTransferData("text/html", htmlstring, textHtml.length * 2);

        xferable.addDataFlavor("text/unicode");
        var unicodestring = Components.classes["@mozilla.org/supports-string;1"]
                        .createInstance(Components.interfaces.nsISupportsString);
        unicodestring.data = textCSV;
        xferable.setTransferData("text/unicode", unicodestring, textCSV.length * 2);

        var clipboard = Components.classes["@mozilla.org/widget/clipboard;1"]
                        .getService(Components.interfaces.nsIClipboard);
        clipboard.setData(xferable, null,
                          Components.interfaces.nsIClipboard.kGlobalClipboard);
    },

    /**
     * Return the options to use to copy HTML table
     * @returns the object {copyStyles, copyLinks, copyImages, copyFormElements}
     */
    getHtmlOptions : function() {
        return {copyStyles : gTable2Clip.prefs.getBool("copyStyles"),
            copyLinks : gTable2Clip.prefs.getBool("copyLinks"),
            copyImages : gTable2Clip.prefs.getBool("copyImages"),
            copyFormElements : gTable2Clip.prefs.getBool("copyFormElements")};
    },

    // From browser.js
    // Returns true if anything is selected.
    isContentSelection : function(sel) {
        return !sel.isCollapsed;
    },

    isTableSelection : function(node) {
        gTable2Clip._selectedTable = null;
        var nodeName = node.localName && node.localName.toLowerCase();

        if (nodeName == "tr" || nodeName == "th") {
            return true;
        }

        if (nodeName == "table") {
            gTable2Clip._selectedTable = node;
            return true;
        }
        var nl = node.childNodes;
        for (var i = 0; i < nl.length; i++) {
            if (node.localName.toLowerCase() == "table") {
                gTable2Clip._selectedTable = nl[i];
                return true;
            }
        }

        return false;
    },

    selectTable : function(table) {
        table = typeof(table) == "undefined" || table == null
            ? gTable2Clip._tableUnderCursor : table;
        if (table) {
            var focusedWindow = document.commandDispatcher.focusedWindow;
            var sel = focusedWindow.getSelection();
            sel.selectAllChildren(table);
        }
    },

    copyWholeTable : function(table) {
        table = typeof(table) == "undefined" || table == null
            ? gTable2Clip._tableUnderCursor : table;
        try {
            var arr = table2clipboard.tableInfo.getTableInfoFromTable(table);
            gTable2Clip.copyToClipboard(arr);
        } catch (err) {
            table2clipboard.common.log("T2C copyWholeTable: " + err);
        }
    },

    getTableUnderCursor : function() {
        if (!(gContextMenu && gContextMenu.target)) {
            return null;
        }
        var nodeUnderCursor = gContextMenu.target;

        return table2clipboard.tableInfo.findTableFromNode(nodeUnderCursor);
    },

    /** nsIController implementation **/

    doCommand : function(command) {
        if (!gTable2Clip.isCommandEnabled(command)) {
            return;
        }
        if (command == "cmd_copyT2C") {
            gTable2Clip.copyTableSelection();
        }
    },

    isCommandEnabled : function(command) {
        if (command == "cmd_copyT2C") {
            var focusedWindow = document.commandDispatcher.focusedWindow;
            if (focusedWindow) {
                var sel = focusedWindow.getSelection();
                return gTable2Clip.isContentSelection(sel)
                         && gTable2Clip.isTableSelection(sel.focusNode);
            }
        }
        return false;
    },

    onEvent : function(eventName) {
    },

    supportsCommand : function(command) {
        return command == "cmd_copyT2C";
    },

    selectTableRow : function() {
        // get node under mouse pointer
        var tr = table2clipboard.tableInfo.getAncestorByTagName(document.popupNode, "tr");

        if (tr) {
            var sel = document.commandDispatcher.focusedWindow.getSelection();
            table2clipboard.tableInfo.selectCells(sel, tr.cells);
        }
    },

    selectTableColumn : function() {
        var sel = document.commandDispatcher.focusedWindow.getSelection();
        var cells = table2clipboard.tableInfo.getTableColumnsByNode(document.popupNode);
        table2clipboard.tableInfo.selectCells(sel, cells);
    },

    onOpenSettings : function(event) {
        window.openDialog("chrome://t2c/content/settings/settings.xul",
                          "_blank",
                          "chrome,modal,resizable=yes,dependent=yes");
    }
}

window.addEventListener("load", gTable2Clip.onLoad, false);
window.addEventListener("unload", gTable2Clip.onUnLoad, false);