import { Routes } from '@angular/router';
import { AddTripComponent } from './add-trip/add-trip.component';
import { TripListingComponent } from './trip-listing/trip-listing.component';
import { EditTripComponent } from './edit-trip/edit-trip.component';
import { LoginComponent } from './login/login.component';
import { AuthGuard } from './guards/auth.guard';
import { UnauthorizedComponent } from './unauthorized/unauthorized.component';

export const routes: Routes = [
    { path: 'add-trip', component: AddTripComponent, canActivate: [AuthGuard] },
    { path: 'edit-trip', component: EditTripComponent, canActivate: [AuthGuard] },
    { path: 'login', component: LoginComponent },
    { path: '', component: TripListingComponent, pathMatch: 'full' },
    { path: 'unauthorized', component: UnauthorizedComponent }
];
    