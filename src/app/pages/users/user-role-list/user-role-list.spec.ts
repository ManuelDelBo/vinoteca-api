import { ComponentFixture, TestBed } from '@angular/core/testing';
import { UserRoleList } from './user-role-list';

describe('UserRoleList', () => {
  let component: UserRoleList;
  let fixture: ComponentFixture<UserRoleList>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UserRoleList],
    }).compileComponents();

    fixture = TestBed.createComponent(UserRoleList);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
