import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';

// Interfaces for our data structures
export interface Product { id: string; name: string; style_tags: string[]; category: string; imageUrl: string; buyLink: string; }
export interface ModelImage { id: number; url: string; status: 'validating' | 'approved' | 'failed'; reason?: string; }
export interface MoodboardItem extends Product { tryOnUrl: string; }
export interface Moodboard { id: string; title: string; description: string; items: MoodboardItem[]; }

// Interface for a chat session summary
export interface ChatSession {
  id: string;
  title: string;
  createdAt: Date;
}

interface AppState {
  modelImages: ModelImage[];
  approvedModelImageUrls: string[];
  productCatalog: Product[];
  selectedProducts: Product[];
  moodboards: Moodboard[];
  isLoading: boolean;
  
  // Chat session management
  chatSessions: ChatSession[];
  activeChatId: string | null;
  
  setIsLoading: (status: boolean) => void;
  loadProductCatalog: () => Promise<void>;
  loadModelImages: () => Promise<void>;
  addPlaceholderImage: (url: string) => number;
  updatePlaceholderImage: (id: number, finalState: Omit<ModelImage, 'id'>) => void;
  deleteModelImage: (imageUrl: string) => void;
  toggleProductSelection: (product: Product) => void;
  clearSelectedProducts: () => void;
  createOrUpdateMoodboard: (title: string, description: string, action: 'CREATE_NEW' | 'ADD_TO_EXISTING', itemsToAdd: Product[], tryOnUrlMap: Record<string, string>) => void;
  
  // New chat management actions
  addChatSession: (id: string) => void;
  setChatTitle: (id: string, title: string) => void;
  setActiveChatId: (id: string | null) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      modelImages: [],
      approvedModelImageUrls: [],
      productCatalog: [],
      selectedProducts: [],
      moodboards: [],
      isLoading: false,
      
      // Initialize chat sessions
      chatSessions: [],
      activeChatId: null,
      
      setIsLoading: (status) => set({ isLoading: status }),
      loadProductCatalog: async () => {
        if (get().productCatalog.length > 0) return;
        const res = await fetch('/data/products.json');
        const products = await res.json();
        set({ productCatalog: products });
      },
      loadModelImages: async () => {
        try {
          console.log('[Store] Loading model images from server...');
          const res = await fetch('/api/get-model-images');
          const data = await res.json();
          console.log('[Store] Loaded model images:', data.images.length);
          
          const approvedUrls = data.images
            .filter((img: ModelImage) => img.status === 'approved')
            .map((img: ModelImage) => img.url);
          
          set({ 
            modelImages: data.images,
            approvedModelImageUrls: approvedUrls
          });
        } catch (error) {
          console.error('[Store] Failed to load model images:', error);
          set({ modelImages: [], approvedModelImageUrls: [] });
        }
      },
      addPlaceholderImage: (url) => {
        const newId = Date.now() + Math.random();
        const newImage: ModelImage = { id: newId, url, status: 'validating', reason: 'Uploading...' };
        set((state) => ({ modelImages: [...state.modelImages, newImage] }));
        console.log('[Store] Added placeholder image with ID:', newId);
        return newId;
      },
      updatePlaceholderImage: (id, finalState) => {
        console.log('[Store] Updating placeholder image:', id, 'with final state:', finalState);
        set((state) => {
          const updatedModelImages = state.modelImages.map((img) => 
            img.id === id ? { id, ...finalState } : img
          );
          
          const approvedUrls = updatedModelImages
            .filter(img => img.status === 'approved')
            .map(img => img.url);
          
          return {
            modelImages: updatedModelImages,
            approvedModelImageUrls: approvedUrls
          };
        });
      },
      // Removes an image from the local state
      deleteModelImage: (imageUrl) => {
        console.log('[Store] Deleting image with URL:', imageUrl);
        set((state) => {
          const updatedModelImages = state.modelImages.filter(img => img.url !== imageUrl);
          
          const approvedUrls = updatedModelImages
            .filter(img => img.status === 'approved')
            .map(img => img.url);

          return {
            modelImages: updatedModelImages,
            approvedModelImageUrls: approvedUrls,
          };
        });
      },
      toggleProductSelection: (product) => {
        set((state) => {
          const isSelected = state.selectedProducts.some((p) => p.id === product.id);
          return {
            selectedProducts: isSelected
              ? state.selectedProducts.filter((p) => p.id !== product.id)
              : [...state.selectedProducts, product],
          };
        });
      },
      clearSelectedProducts: () => set({ selectedProducts: [] }),
      createOrUpdateMoodboard: (title, description, action, itemsToAdd, tryOnUrlMap) => {
        const newMoodboardItems = itemsToAdd.map(product => ({
          ...product,
          tryOnUrl: tryOnUrlMap[product.id]
        }));

        set(state => {
          if (action === 'CREATE_NEW') {
            const newMoodboard: Moodboard = {
              id: uuidv4(),
              title,
              description,
              items: newMoodboardItems,
            };
            return { moodboards: [...state.moodboards, newMoodboard] };
          } else { // ADD_TO_EXISTING
            return {
              moodboards: state.moodboards.map(board => 
                board.title === title 
                  ? { ...board, items: [...board.items, ...newMoodboardItems] } 
                  : board
              )
            };
          }
        });
      },
      
      // --- NEW ACTIONS FOR CHAT MANAGEMENT ---
      addChatSession: (id) => {
        const newSession: ChatSession = { id, title: 'New Chat', createdAt: new Date() };
        set(state => ({ 
          chatSessions: [...state.chatSessions, newSession],
          activeChatId: id,
        }));
      },

      setChatTitle: (id, title) => {
        set(state => ({
          chatSessions: state.chatSessions.map(session => 
            session.id === id ? { ...session, title } : session
          )
        }));
      },
      
      setActiveChatId: (id) => set({ activeChatId: id }),
    }),
    {
      name: 'ai-fashion-storage',
      partialize: (state) => ({
          modelImages: state.modelImages,
          approvedModelImageUrls: state.approvedModelImageUrls,
          selectedProducts: state.selectedProducts,
          moodboards: state.moodboards,
          chatSessions: state.chatSessions, // Persist the chat list
          activeChatId: state.activeChatId,
      }),
    }
  )
); 