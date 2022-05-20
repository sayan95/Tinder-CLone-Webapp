import { Injectable } from "@angular/core";
import { Actions, createEffect, ofType } from "@ngrx/effects";
import { Action, Store } from "@ngrx/store";
import { catchError, finalize, map, Observable, of, switchMap, tap } from "rxjs";
import { AuthService } from "src/app/core/services/auth.service";
import { AuthUser, LoginRequest } from "src/app/shared/models/auth";
import { AppState } from "src/app/store/app.state";
import * as authActions from './auth.actions';
import * as sharedActions from '../shared/shared.actions';
import { Router } from "@angular/router";

@Injectable()
export class AuthEffect{

    public memberLogin$: Observable<Action> = createEffect(() => { 
        return this.actions$.pipe(
            ofType(authActions.MEMBER_LOGIN_START),
            switchMap((action:authActions.MemberLoginStart) => {
                const requestPayload: LoginRequest = action.payload;
                return this.authService.login(requestPayload).pipe(
                    map((response: AuthUser) => {
                        this.store.dispatch(new sharedActions.AppLoadingStateChange(false));
                        this.authService.setTokenToLocalStorage(response.token);
                        return new authActions.MemberLoginSuccess(response);
                    }),
                    catchError((error: any) => {
                        this.store.dispatch(new sharedActions.AppLoadingStateChange(false));
                        const errorResponse = error.error; 
                        return of(new authActions.MemberLoginFailed(errorResponse));
                    })
                );
            })
        );
    });

    public redirectToDashboardOnLoginSuccess: Observable<never> = createEffect(() => {
        return this.actions$.pipe(
            ofType(authActions.MEMBER_LOGIN_SUCCESS),
            tap(() => {
                this.router.navigateByUrl('/dashboard');
            })
        );
    }, {dispatch: false});

    public performingAppAutoLogin = createEffect(() => {
        return this.actions$.pipe(
            ofType(authActions.PERFORMING_AUTO_LOGIN),
            switchMap((action : authActions.PerformingAutLogin) => {
                return this.authService.performAutoLogin().pipe(
                    map((response: AuthUser) => {
                        return new authActions.MemberLoginSuccess(response);
                    })
                );
            })
        );
    });

    constructor(private actions$: Actions,
        private authService: AuthService,
        private store: Store<AppState>,
        private router: Router){}
}