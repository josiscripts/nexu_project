import { ExtractJwt, Strategy, StrategyOptions } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    const secretKey = process.env.JWT_SECRET;
    if (!secretKey) {
      throw new Error('JWT_SECRET no está definido en el .env');
    }

    const options: StrategyOptions = {
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: secretKey,
    };

    super(options);
  }

  async validate(payload: any) {
    return { userId: payload.sub, email: payload.email };
  }
}
