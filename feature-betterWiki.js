chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log("Config:", message.config);
    const featureConfig = message.config.betterWiki;

    // Désactiver la fonctionnalité si elle n'est pas activée dans la configuration
    if (!featureConfig?.enabled) return;

    initializeFeature(featureConfig);
});

async function initializeFeature(featureConfig) {
    try {
        const toolbar = await getToolbarWithRetry();

        // Check if the toolbar is found and if the button already exists
        const existingButton = document.getElementById("CommandBar0template-menu-item");
        if (existingButton) {
            console.log("Button already exists, skipping creation.");
            return;
        }

        // Add a new button to the toolbar
        const newButton = document.createElement("div");
        newButton.className = "ms-CommandBarItem item_278ff396 markdowntoolbar-button";
    
        newButton.innerHTML = `
            <div class="ms-TooltipHost host_3d36397f">
                <button name="Templates" class="ms-CommandBarItem-link itemLink_278ff396" icon="Add" title="Templates" id="CommandBar0template-menu-item" data-command-key="template-menu-item" aria-haspopup="true" aria-expanded="false" role="menuitem" aria-label="Templates" aria-setsize="16" aria-posinset="16" tabindex="-1">
                    <i data-icon-name="Add" role="presentation" aria-hidden="true" class="ms-CommandBarItem-icon itemIcon_278ff396 ms-CommandBarItem-iconColor itemIconColor_278ff396 root-41">➕</i>
                    <span class="ms-CommandBarItem-commandText itemCommandText_278ff396">Templates</span>
                </button>
            </div>
        `;

        // Append the new button to the toolbar
        toolbar.appendChild(newButton);

        // Create the dropdown list
        const dropdown = document.createElement("ul");
        dropdown.className = "custom-dropdown hidden";

        // Use the passed configuration to populate templates
        const templates = featureConfig?.templates || [];

        if (templates.length > 0) {
            templates.forEach((template, index) => {
                const listItem = document.createElement("li");
                listItem.className = "custom-dropdown-item";
                listItem.role = "menuitem";
                listItem.innerHTML = `
                    <button class="ms-ContextualMenu-link root-61" tabindex="${index === 0 ? "0" : "-1"}">
                        <div class="ms-ContextualMenu-linkContent linkContent-64">
                            <i class="ms-ContextualMenu-icon icon-73">${template.emoji || "📄"}</i>
                            <span class="ms-ContextualMenu-itemText label-69">${template.title}</span>
                        </div>
                    </button>
                `;
                listItem.addEventListener("click", () => {
                    insertTemplateContent(template.content);
                    dropdown.classList.add("hidden"); // Hide the dropdown after selection
                });
                dropdown.appendChild(listItem);
            });
        } else {
            const noTemplatesItem = document.createElement("li");
            noTemplatesItem.className = "custom-dropdown-item";
            noTemplatesItem.role = "menuitem";
            noTemplatesItem.innerHTML = `
                <button class="ms-ContextualMenu-link root-61" tabindex="0" disabled>
                    <div class="ms-ContextualMenu-linkContent linkContent-64">
                        <span class="ms-ContextualMenu-itemText label-69">Aucun template disponible</span>
                    </div>
                </button>
            `;
            dropdown.appendChild(noTemplatesItem);
        }

        // Append the dropdown to the body
        document.body.appendChild(dropdown);

        // Add an event listener for the new button
        newButton.querySelector("button").addEventListener("click", (e) => {
            const rect = e.target.getBoundingClientRect();
            dropdown.style.top = `${rect.bottom + window.scrollY}px`;
            dropdown.style.left = `${rect.left + window.scrollX}px`;
            dropdown.classList.toggle("hidden");
        });

        // Hide the dropdown if clicking outside
        document.addEventListener("click", (e) => {
            if (!newButton.contains(e.target) && !dropdown.contains(e.target)) {
                dropdown.classList.add("hidden");
            }
        });

        // Set the cursor at the beginning of the textarea
        const textarea = document.querySelector("textarea");
        if (textarea) {
            textarea.focus();
            textarea.setSelectionRange(0, 0);
        } else {
            console.log("Wiki editor textarea not found.");
        }

        console.log("Custom button with dynamic templates dropdown added to the toolbar.");
    } catch (error) {
        console.log(error.message);
    }
}

function insertTemplateContent(content) {
    const textarea = document.querySelector("textarea"); // Assuming the wiki editor uses a textarea
    if (textarea) {
        const cursorPosition = textarea.selectionStart;
        const textBefore = textarea.value.substring(0, cursorPosition);
        const textAfter = textarea.value.substring(cursorPosition);
        textarea.value = `${textBefore}${content}${textAfter}`;

        // Restore the cursor position without scrolling
        textarea.setSelectionRange(cursorPosition + content.length, cursorPosition + content.length);
        textarea.focus({ preventScroll: true });

        // Simulate a keyup event
        const keyupEvent = new Event("change", { bubbles: true});
        textarea.dispatchEvent(keyupEvent);
    } else {
        console.log("Wiki editor textarea not found.");
    }
}

function getToolbarWithRetry(retries = 10, delay = 200) {
    return new Promise((resolve, reject) => {
        const attempt = (remainingRetries) => {
            const toolbar = document.querySelector(".ms-CommandBar-primaryCommands");
            if (toolbar) {
                resolve(toolbar);
            } else if (remainingRetries > 0) {
                setTimeout(() => attempt(remainingRetries - 1), delay);
            } else {
                reject(new Error("Toolbar not found after multiple attempts."));
            }
        };
        attempt(retries);
    });
}