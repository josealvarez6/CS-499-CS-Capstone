export class User {
    email: string;
    name: string;

    // Role used to determine wheter the current user can access
    // admin features.
    role: 'admin' | 'user';

    constructor()
    {
        this.email = '';
        this.name = '';
        this.role = 'user';
    }
}
