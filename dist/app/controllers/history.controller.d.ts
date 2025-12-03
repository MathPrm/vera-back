import { Request, Response } from 'express';
export declare class HistoryController {
    /**
     * Récupérer l'historique des conversations de l'utilisateur
     */
    static getHistory(req: Request, res: Response): Promise<Response>;
    /**
     * Récupérer une conversation spécifique avec tous ses messages
     */
    static getConversation(req: Request, res: Response): Promise<Response>;
    /**
     * Créer une nouvelle conversation
     */
    static createConversation(req: Request, res: Response): Promise<Response>;
    /**
     * Ajouter un message à une conversation
     */
    static addMessage(req: Request, res: Response): Promise<Response>;
    /**
     * Supprimer une conversation (soft delete)
     */
    static deleteConversation(req: Request, res: Response): Promise<Response>;
    /**
     * Effacer tout l'historique de l'utilisateur
     */
    static clearHistory(req: Request, res: Response): Promise<Response>;
    /**
     * Sauvegarder une conversation complète (pour migration depuis localStorage)
     */
    static saveConversation(req: Request, res: Response): Promise<Response>;
}
//# sourceMappingURL=history.controller.d.ts.map