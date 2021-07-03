declare namespace Caller {
    /**
     * The contacts JSON file should match this interface.
     */
    interface Book {
        contacts: Contact[];
    }

    interface Contact {
        name: string;
        code: string;
        phone: string;
    }
}
