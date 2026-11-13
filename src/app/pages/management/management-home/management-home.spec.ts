import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ManagementHome } from './management-home';

describe('ManagementHome', () => {
  let component: ManagementHome;
  let fixture: ComponentFixture<ManagementHome>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ManagementHome],
    }).compileComponents();

    fixture = TestBed.createComponent(ManagementHome);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
