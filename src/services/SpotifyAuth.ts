// Spotify Authentication - OAuth real para Flowstate
// Implementación básica de autenticación con Spotify Web API

export interface SpotifyAuthConfig {
  clientId: string;
  redirectUri: string;
  scopes: string[];
}

export interface SpotifyTokens {
  accessToken: string;
  refreshToken?: string;
  expiresIn: number;
  expiresAt: number;
  tokenType: string;
}

export class SpotifyAuth {
  private config: SpotifyAuthConfig;
  private tokens: SpotifyTokens | null = null;

  constructor(config: SpotifyAuthConfig) {
    this.config = config;
    this.loadStoredTokens();
  }

  // Initialize Spotify authentication
  async authenticate(): Promise<boolean> {
    try {
      // Check if we already have valid tokens
      if (this.tokens && this.isTokenValid()) {
        console.log('🎵 Using existing Spotify tokens');
        return true;
      }

      // Start OAuth flow
      const authUrl = this.buildAuthUrl();
      
      // For demo purposes, we'll simulate the OAuth flow
      console.log('🔗 Spotify Auth URL:', authUrl);
      
      // In a real app, you would:
      // 1. Redirect to Spotify authorization
      // 2. Handle callback with authorization code
      // 3. Exchange code for access token
      
      // For demo, simulate successful auth
      const mockTokens: SpotifyTokens = {
        accessToken: `mock_spotify_token_${Date.now()}`,
        refreshToken: `mock_refresh_token_${Date.now()}`,
        expiresIn: 3600,
        expiresAt: Date.now() + (3600 * 1000),
        tokenType: 'Bearer'
      };

      this.tokens = mockTokens;
      this.saveTokens();
      
      console.log('✅ Spotify authentication successful (mock)');
      return true;
      
    } catch (error) {
      console.error('❌ Spotify authentication failed:', error);
      return false;
    }
  }

  // Real Spotify authentication flow (for production)
  async authenticateReal(): Promise<boolean> {
    try {
      // Generate state parameter for security
      const state = this.generateRandomString(16);
      localStorage.setItem('spotify_auth_state', state);

      // Build authorization URL with all required parameters
      const authParams = new URLSearchParams({
        response_type: 'code',
        client_id: this.config.clientId,
        scope: this.config.scopes.join(' '),
        redirect_uri: this.config.redirectUri,
        state: state,
        show_dialog: 'true' // Force login dialog
      });

      const authUrl = `https://accounts.spotify.com/authorize?${authParams.toString()}`;
      
      // Open in popup for better UX
      const popup = window.open(
        authUrl,
        'spotify-auth',
        'width=600,height=700,left=' + (screen.width / 2 - 300) + ',top=' + (screen.height / 2 - 350)
      );

      if (!popup) {
        throw new Error('Popup blocker may be preventing authentication');
      }

      // Wait for popup to close (user completed auth)
      return new Promise((resolve) => {
        const checkClosed = setInterval(() => {
          if (popup.closed) {
            clearInterval(checkClosed);
            
            // Check if tokens were received (in real app, handle callback)
            const storedTokens = this.loadStoredTokens();
            if (storedTokens) {
              resolve(true);
            } else {
              resolve(false);
            }
          }
        }, 1000);

        // Timeout after 5 minutes
        setTimeout(() => {
          clearInterval(checkClosed);
          if (!popup.closed) {
            popup.close();
          }
          resolve(false);
        }, 5 * 60 * 1000);
      });

    } catch (error) {
      console.error('❌ Real Spotify auth failed:', error);
      return false;
    }
  }

  // Start authentication with user interaction
  async startAuthentication(): Promise<boolean> {
    try {
      console.log('🎵 Starting Spotify authentication...');
      
      // Show user-friendly dialog
      const userConfirmed = confirm(
        '🎵 Conectar con Spotify\n\n' +
        '¿Quieres conectar tu cuenta de Spotify?\n\n' +
        '✅ Beneficios:\n' +
        '• Acceso a millones de tracks\n' +
        '• Búsqueda en tu librería personal\n' +
        '• Previews de 30 segundos\n' +
        '• Análisis de audio avanzado\n\n' +
        '⚠️ Nota: Esta es una demo, la conexión es simulada.'
      );

      if (!userConfirmed) {
        console.log('❌ User cancelled Spotify authentication');
        return false;
      }

      // Simulate authentication process with loading
      const authSteps = [
        'Conectando con Spotify...',
        'Validando permisos...',
        'Obteniendo token de acceso...',
        '¡Conexión exitosa!'
      ];

      for (let i = 0; i < authSteps.length; i++) {
        console.log(`🔄 ${authSteps[i]}`);
        await new Promise(resolve => setTimeout(resolve, 800));
      }

      // Complete authentication
      const success = await this.authenticate();
      
      if (success) {
        alert('✅ ¡Conectado con Spotify!\n\n🎵 Ahora puedes:\n• Buscar en millones de tracks\n• Acceder a tu librería personal\n• Reproducir previews de 30s\n\n🚀 Ve a la tab "🌐 APIs" para empezar.');
      } else {
        alert('❌ Error conectando con Spotify.\n\nEn una app real, esto abriría la ventana de autorización de Spotify.\n\n💡 Por ahora, la funcionalidad es simulada.');
      }

      return success;
    } catch (error) {
      console.error('❌ Authentication start failed:', error);
      return false;
    }
  }

  // Build authorization URL
  private buildAuthUrl(): string {
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: this.config.clientId,
      scope: this.config.scopes.join(' '),
      redirect_uri: this.config.redirectUri,
      state: this.generateRandomString(16)
    });

    return `https://accounts.spotify.com/authorize?${params.toString()}`;
  }

  // Check if current token is valid
  private isTokenValid(): boolean {
    if (!this.tokens) return false;
    return Date.now() < this.tokens.expiresAt;
  }

  // Save tokens to localStorage
  private saveTokens(): void {
    if (this.tokens && typeof window !== 'undefined') {
      localStorage.setItem('flowstate_spotify_tokens', JSON.stringify(this.tokens));
    }
  }

  // Load tokens from localStorage
  private loadStoredTokens(): SpotifyTokens | null {
    if (typeof window === 'undefined') return null;
    
    try {
      const stored = localStorage.getItem('flowstate_spotify_tokens');
      if (stored) {
        const tokens = JSON.parse(stored) as SpotifyTokens;
        if (this.isValidTokenStructure(tokens)) {
          this.tokens = tokens;
          return tokens;
        }
      }
    } catch (error) {
      console.warn('Failed to load stored tokens:', error);
    }
    
    return null;
  }

  // Validate token structure
  private isValidTokenStructure(tokens: any): tokens is SpotifyTokens {
    return tokens && 
           typeof tokens.accessToken === 'string' &&
           typeof tokens.expiresAt === 'number' &&
           typeof tokens.tokenType === 'string';
  }

  // Generate random string for state parameter
  private generateRandomString(length: number): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  // Get access token for API calls
  getAccessToken(): string | null {
    if (this.tokens && this.isTokenValid()) {
      return this.tokens.accessToken;
    }
    return null;
  }

  // Check authentication status
  isAuthenticated(): boolean {
    return this.tokens !== null && this.isTokenValid();
  }

  // Logout
  logout(): void {
    this.tokens = null;
    if (typeof window !== 'undefined') {
      localStorage.removeItem('flowstate_spotify_tokens');
    }
    console.log('🔓 Spotify logout completed');
  }
}

// Default configuration
const defaultConfig: SpotifyAuthConfig = {
  clientId: 'your_spotify_client_id', // En producción, usar variable de entorno
  redirectUri: typeof window !== 'undefined' ? `${window.location.origin}/callback/spotify` : 'http://localhost:3000/callback/spotify',
  scopes: [
    'user-read-playback-state',
    'user-modify-playback-state',
    'user-read-currently-playing',
    'streaming',
    'user-library-read',
    'playlist-read-private',
    'playlist-read-collaborative'
  ]
};

export const spotifyAuth = new SpotifyAuth(defaultConfig);