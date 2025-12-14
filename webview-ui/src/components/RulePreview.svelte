<script lang="ts">
  import type { RuleFile } from "../stores/vscode";
  import { parseFrontmatter, serializeFrontmatter } from "../utils/frontmatter";
  import PreviewHeader from "./preview/PreviewHeader.svelte";
  import PreviewMetadata from "./preview/PreviewMetadata.svelte";
  import PreviewContent from "./preview/PreviewContent.svelte";

  export let rule: RuleFile;
  export let onOpenFile: (path: string) => void;
  export let onRuleUpdate: ((path: string, content: string) => void) | undefined = undefined;

  $: parsed = parseFrontmatter(rule.content);

  function handleMetadataUpdate(event: CustomEvent<{ key: string; value: unknown }>) {
    const { key, value } = event.detail;

    // Create updated frontmatter with proper typing
    const updatedFrontmatter = {
      ...parsed.frontmatter,
      [key]: value as string | boolean | undefined,
    };

    // Serialize back to content
    const updatedContent = serializeFrontmatter(updatedFrontmatter, parsed.content);

    // Notify parent
    onRuleUpdate?.(rule.path, updatedContent);
  }

  function handleContentUpdate(event: CustomEvent<{ content: string }>) {
    const { content } = event.detail;

    // Serialize with existing frontmatter and new content
    const updatedContent = serializeFrontmatter(parsed.frontmatter, content);

    // Notify parent
    onRuleUpdate?.(rule.path, updatedContent);
  }
</script>

<div class="preview-container">
  <PreviewHeader name={rule.name} path={rule.path} {onOpenFile} />
  <PreviewMetadata
    frontmatter={parsed.frontmatter}
    rulePath={rule.path}
    on:update={handleMetadataUpdate}
  />
  <PreviewContent content={parsed.content} rulePath={rule.path} on:update={handleContentUpdate} />
</div>

<style>
  .preview-container {
    display: flex;
    flex-direction: column;
    height: 100%;
    overflow: hidden;
  }
</style>
