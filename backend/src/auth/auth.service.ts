import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHmac, timingSafeEqual } from 'node:crypto';
import { LoginDto } from './dto/login.dto';
import type { AuthUser, UserRole } from './auth.types';

type DemoUser = AuthUser & { password: string };

@Injectable()
export class AuthService {
  private readonly users: DemoUser[] = [
    {
      id: 'USR-ADMIN',
      name: 'Operations Admin',
      email: 'admin@droneops.demo',
      password: 'AdminDemo!2026',
      role: 'admin',
    },
    {
      id: 'USR-DISPATCH',
      name: 'Flight Dispatcher',
      email: 'dispatcher@droneops.demo',
      password: 'DispatchDemo!2026',
      role: 'dispatcher',
    },
    {
      id: 'USR-CUSTOMER',
      name: 'Demo Customer',
      email: 'customer@droneops.demo',
      password: 'CustomerDemo!2026',
      role: 'customer',
    },
  ];

  constructor(private readonly config: ConfigService) {}

  login(dto: LoginDto) {
    const user = this.users.find(
      (item) => item.email.toLowerCase() === dto.email.toLowerCase(),
    );
    if (!user || !this.equal(dto.password, user.password)) {
      throw new UnauthorizedException('Invalid email or password.');
    }
    const { password, ...profile } = user;
    void password;
    return {
      accessToken: this.sign(profile),
      user: profile,
      expiresInSeconds: 60 * 60 * 8,
      authenticationMode: this.config.get('AUTH_SECRET')
        ? 'configured-secret'
        : 'demo-secret',
    };
  }

  authenticate(token: string): AuthUser {
    const [encoded, signature] = token.split('.');
    if (
      !encoded ||
      !signature ||
      !this.equal(signature, this.signature(encoded))
    ) {
      throw new UnauthorizedException('Invalid authentication token.');
    }
    const payload = JSON.parse(
      Buffer.from(encoded, 'base64url').toString('utf8'),
    ) as AuthUser & { exp: number };
    if (payload.exp < Date.now()) {
      throw new UnauthorizedException('Authentication token expired.');
    }
    return {
      id: payload.id,
      name: payload.name,
      email: payload.email,
      role: payload.role,
    };
  }

  roleCapabilities(role: UserRole) {
    const capabilities = {
      admin: [
        'manage fleet',
        'manage geofences',
        'dispatch missions',
        'view audit',
      ],
      dispatcher: ['dispatch missions', 'monitor weather', 'track fleet'],
      customer: ['create delivery', 'receive quote', 'track shipment'],
    };
    return capabilities[role];
  }

  private sign(user: AuthUser) {
    const encoded = Buffer.from(
      JSON.stringify({ ...user, exp: Date.now() + 60 * 60 * 8 * 1000 }),
    ).toString('base64url');
    return `${encoded}.${this.signature(encoded)}`;
  }

  private signature(payload: string) {
    return createHmac('sha256', this.secret())
      .update(payload)
      .digest('base64url');
  }

  private secret() {
    return (
      this.config.get<string>('AUTH_SECRET') ??
      'droneops-demo-only-secret-configure-auth-secret-in-production'
    );
  }

  private equal(first: string, second: string) {
    const firstBuffer = Buffer.from(first);
    const secondBuffer = Buffer.from(second);
    return (
      firstBuffer.length === secondBuffer.length &&
      timingSafeEqual(firstBuffer, secondBuffer)
    );
  }
}
