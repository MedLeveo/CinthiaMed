import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { userQueries } from '../database/db.js';

// Configuração do Google OAuth
export const configurePassport = () => {
  // Serializar usuário (salvar na sessão)
  passport.serializeUser((user, done) => {
    done(null, user.id);
  });

  // Deserializar usuário (recuperar da sessão)
  passport.deserializeUser(async (id, done) => {
    try {
      const user = await userQueries.findById(id);
      done(null, user);
    } catch (error) {
      done(error, null);
    }
  });

  // Estratégia do Google OAuth
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:5000/api/auth/google/callback',
        passReqToCallback: true,
      },
      async (req, accessToken, refreshToken, profile, done) => {
        try {
          console.log('📧 Login com Google:', profile.emails[0].value);

          // Verificar se usuário já existe pelo Google ID
          let user = await userQueries.findByGoogleId(profile.id);

          if (user) {
            console.log('✅ Usuário existente encontrado:', user.email);
            return done(null, user);
          }

          // Verificar se existe usuário com mesmo email
          user = await userQueries.findByEmail(profile.emails[0].value);

          if (user) {
            // Usuário existe mas nunca fez login com Google - vincular conta
            console.log('🔗 Vinculando conta Google ao usuário existente');
            // Aqui você pode adicionar uma query para atualizar o google_id do usuário
            // Por enquanto, vamos apenas retornar o usuário
            return done(null, user);
          }

          // Criar novo usuário
          console.log('🆕 Criando novo usuário com Google');
          const newUser = await userQueries.createUser(
            profile.displayName || profile.emails[0].value.split('@')[0],
            profile.emails[0].value,
            null, // password_hash é null para login com Google
            profile.id, // google_id
            profile.photos && profile.photos[0] ? profile.photos[0].value : null // avatar_url
          );

          console.log('✅ Novo usuário criado:', newUser.email);
          return done(null, newUser);
        } catch (error) {
          console.error('❌ Erro no Google OAuth:', error);
          return done(error, null);
        }
      }
    )
  );

  return passport;
};

export default passport;
