import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { UserService } from '../../../services/user.service';
import { UserRoleList } from './user-role-list';

describe('UserRoleList', () => {
  let component: UserRoleList;
  let fixture: ComponentFixture<UserRoleList>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UserRoleList],
      providers: [
        provideRouter([]),
        {
          provide: UserService,
          useValue: {
            getUsers: () => of([]),
            getInactiveUsers: () => of([])
          }
        }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(UserRoleList);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
