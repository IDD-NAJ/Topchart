export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && typeof navigator.clipboard.writeText === "function") {
      await navigator.clipboard.writeText(text)
      return true
    }
  } catch (e) {
  }
  
  try {
    const textArea = document.createElement("textarea")
    textArea.value = text
    textArea.style.position = "fixed"
    textArea.style.left = "-999999px"
    textArea.style.top = "-999999px"
    document.body.appendChild(textArea)
    textArea.focus()
    textArea.select()
    
    let success = false
    try {
      success = document.execCommand("copy")
    } catch (err) {
      success = false
    }
    
    document.body.removeChild(textArea)
    return success
  } catch (e) {
    return false
  }
}
