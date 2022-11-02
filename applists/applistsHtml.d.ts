type HtmlAdditions = {
    /** Add these `data-${key}` attributes to the element. */
    dataset: {[key: string]: string};

    /** Manually adds this list of class names to the element. */
    classList: (string|null)[];

    /** Sets the placeholder text for an `<input/>` element. */
    placeholder: string;

    /** Manually sets the CSS style properties. */
    style: { [ property in keyof CSSStyleDeclaration ]?: string };

    /** Sets the ARIA Role of the element. */
    role:
        | "alert" | "application" | "article" | "banner" | "button"
        | "cell" | "checkbox" | "comment" | "complementary"
        | "contentinfo" | "dialog" | "document" | "feed" | "figure"
        | "form" | "grid" | "gridcell" | "heading" | "img" | "list"
        | "listbox" | "listitem" | "main" | "mark" | "navigation"
        | "region" | "row" | "rowgroup" | "search" | "suggestion"
        | "switch" | "tab" | "table" | "tabpanel" | "text" | "textbox"
        | "timer";
    /** Sets the ARIA Label for the element. */
    ariaLabel: string;
    /** Sets whether or not ARIA hides this element. */
    ariaHidden: boolean;
    /** Sets whether or not ARIA reads this element as "checked". */
    ariaChecked: "true" | "false";
};

type HtmlAttributeSet<T extends keyof HTMLElementTagNameMap> =
    Partial<Omit<HTMLElementTagNameMap[T], keyof HtmlAdditions>>
    & Partial<HtmlAdditions>;

type HtmlChildrenSet = (Element|string|null)[] | Element|string|null;
