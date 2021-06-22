import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { User } from '../../model/user/user.model';
import { allParticipantsByQuery, allParticipantsLink, participantLink } from '../../../links';

@Injectable({
  providedIn: 'root'
})

export class UserService {
  constructor(private http: HttpClient) {}

  public getCurrentUser(): Observable<User> {
    return this.http.get<User>(`${participantLink}`);
  }
  public getAllUsers(): Observable<User[]> {
    return this.http.get<User[]>(`${allParticipantsLink}`);
  }
  public getAllUsersByQuery(name: string): Observable<User[]> {
    return this.http.get<User[]>(`${allParticipantsByQuery}` + name);
  }
}
