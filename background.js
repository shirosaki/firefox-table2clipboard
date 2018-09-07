let parentId = browser.menus.create({
    id: "table-2-clipboard",
    title: "Table2Clipboard",
    contexts: ["all"],
});

let copySelectedCellsId = browser.menus.create({
    id: "copy-selected-cells",
    title: browser.i18n.getMessage("copySelectedCells"),
    contexts: ["all"],
    parentId,
    onclick: copySelectedCells
});

let copyWholeTableId = browser.menus.create({
    id: "copy-whole-table",
    title: browser.i18n.getMessage("copyWholeTable"),
    contexts: ["all"],
    parentId,
    onclick: copyWholeTable
});

let separatorId = browser.menus.create({
    type: "separator",
    id: "separator",
    contexts: ["all"],
    parentId,
});

let selectTableRowId = browser.menus.create({
    id: "select-row",
    title: browser.i18n.getMessage("selectRow"),
    contexts: ["all"],
    parentId,
    onclick: selectTableRow
});

let selectTableColumnId = browser.menus.create({
    id: "select-column",
    title: browser.i18n.getMessage("selectColumn"),
    contexts: ["all"],
    parentId,
    onclick: selectTableColumn
});

let selectTableId = browser.menus.create({
    id: "select-table",
    title: browser.i18n.getMessage("selectTable"),
    contexts: ["all"],
    parentId,
    onclick: selectTable
});

function loadScripts() {
    return browser.tabs.executeScript({
        code: "typeof gTable2Clip === 'object';",
    }).then((results) => {
        // The content script's last expression will be true if the function
        // has been defined. If this is not the case, then we need to run
        // t2cOverlay.js to define function gTable2Clip.
        if (!results || results[0] !== true) {
            return browser.tabs.executeScript({
                file: "src/main/content/t2c/prefs.js"
            }).then(() => {
                return browser.tabs.executeScript({
                    file: "src/main/content/t2c/common.js"
                });
            }).then(() => {
                return browser.tabs.executeScript({
                    file: "src/main/content/t2c/tableInfo.js"
                });
            }).then(() => {
                return browser.tabs.executeScript({
                    file: "src/main/content/t2c/htmlFilter.js"
                });
            }).then(() => {
                return browser.tabs.executeScript({
                    file: "src/main/content/t2c/htmlBuilder.js"
                });
            }).then(() => {
                return browser.tabs.executeScript({
                    file: "src/main/content/t2c/cssUtils.js"
                });
            }).then(() => {
                return browser.tabs.executeScript({
                    file: "src/main/content/t2c/formatters.js"
                });
            }).then(() => {
                return browser.tabs.executeScript({
                    file: "src/main/content/t2c/t2cOverlay.js"
                });
            }).then(() => {
                return executeScript("gTable2Clip.onLoad();");
            });
        }
    });
}

browser.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === 'complete') {
        loadScripts();
    }
});

browser.tabs.onActivated.addListener((activeInfo) => {
    loadScripts();
});

browser.menus.onShown.addListener((info, tab) => {
    let isOnTable, hasSelectedCells, isOnCell;
    executeScript("gTable2Clip.isOnTable();")
    .then((results) => {
        isOnTable = results && results[0];
    }).then(() => {
        return executeScript("gTable2Clip.hasSelectedCells();")
        .then((results) => {
            hasSelectedCells = results && results[0];
        });
    }).then(() => {
        return executeScript("gTable2Clip.isOnCell();")
        .then((results) => {
            isOnCell = results && results[0];
        });
    }).then(() => {
        let shouldShow = hasSelectedCells || isOnTable;
        Promise.all([
            browser.menus.update(parentId, {
                enabled: shouldShow
            }),
            browser.menus.update(copySelectedCellsId, {
                enabled: hasSelectedCells
            }),
            browser.menus.update(selectTableId, {
                enabled: isOnTable
            }),
            browser.menus.update(copyWholeTableId, {
                enabled: isOnTable
            }),
            browser.menus.update(selectTableRowId, {
                enabled: isOnTable
            }),
            browser.menus.update(selectTableColumnId, {
                enabled: isOnTable && isOnCell
            }),
        ]) .then(() => {
            browser.menus.refresh();
        });
    });
});

function copySelectedCells() {
    executeScript("gTable2Clip.copySelectedCells();");
}

function copyWholeTable() {
    executeScript("gTable2Clip.copyWholeTable();");
}

function selectTableRow() {
    executeScript("gTable2Clip.selectTableRow();");
}

function selectTableColumn() {
    executeScript("gTable2Clip.selectTableColumn();");
}

function selectTable() {
    executeScript("gTable2Clip.selectTable();");
}

function executeScript(code) {
    if (code) {
        return browser.tabs.executeScript({
            code
        }).catch((error) => {
            console.error("Failed to executeScript: " + code + " : " + error);
        });
    }
}
