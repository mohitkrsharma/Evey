import { TestBed, async, inject } from '@angular/core/testing';

import { LivedashGuard } from './livedash.guard';

describe('LivedashGuard', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [LivedashGuard]
    });
  });

  it('should ...', inject([LivedashGuard], (guard: LivedashGuard) => {
    expect(guard).toBeTruthy();
  }));
});
