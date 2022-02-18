import { TestBed } from '@angular/core/testing';

import { Aes256Service } from './aes-256.service';

describe('Aes256Service', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: Aes256Service = TestBed.get(Aes256Service);
    expect(service).toBeTruthy();
  });
});
