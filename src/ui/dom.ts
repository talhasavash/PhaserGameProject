// HTML elemanlarını doğru türle bulur; eksik bir arayüz bağlantısında anlaşılır hata verir.
export function element<T extends HTMLElement = HTMLElement>(id: string, root: Document = document): T {
    const result = root.getElementById(id);
    if (!result) throw new Error(`Arayüz elemanı bulunamadı: ${id}`);
    return result as T;
}
