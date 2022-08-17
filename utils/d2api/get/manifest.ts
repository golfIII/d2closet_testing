// Manifest related API functions will be here
import { D2APIRoot, D2APIResponse } from '@d2/base.ts'

// Inner response returned by the destiny API on a successful request
// https://bungie-net.github.io/#Destiny2.GetDestinyManifest
export interface D2APIManifestResponse {
    version: string,
    mobileAssetContentPath: string,
    mobileGearAssetDataBases: {
        version: number,
        path: string
    }[],
    mobileWorldContentPaths: Record<string, string>,
    jsonWorldContentPaths: Record<string, string>,
    jsonWorldComponentContentPaths: Record<string, Object>,
    mobileClanBannerDatabasePath: string,
    mobileGearCDN: Record<string, string>,
    iconImagePyramidInfo: {
        name: string,
        number: string
    }[]
}

// Different entity definitions within the manifest.
// https://bungie-net.github.io/#/components/schemas/Destiny.Config.DestinyManifest
export enum D2ManifestDefinition {
    DestinyNodeStepSummaryDefinition = 'DestinyNodeStepSummaryDefinition',
    DestinyArtDyeChannelDefinition = 'DestinyArtDyeChannelDefinition',  
    DestinyArtDyeReferenceDefinition = 'DestinyArtDyeReferenceDefinition',
    DestinyPlaceDefinition = 'DestinyPlaceDefinition',
    DestinyActivityDefinition = 'DestinyActivityDefinition',       
    DestinyActivityTypeDefinition = 'DestinyActivityTypeDefinition',   
    DestinyClassDefinition = 'DestinyClassDefinition',
    DestinyGenderDefinition = 'DestinyGenderDefinition',
    DestinyInventoryBucketDefinition = 'DestinyInventoryBucketDefinition',
    DestinyRaceDefinition = 'DestinyRaceDefinition',
    DestinyTalentGridDefinition = 'DestinyTalentGridDefinition',
    DestinyUnlockDefinition = 'DestinyUnlockDefinition',
    DestinySandboxPerkDefinition = 'DestinySandboxPerkDefinition',
    DestinyStatGroupDefinition = 'DestinyStatGroupDefinition',
    DestinyProgressionMappingDefinition = 'DestinyProgressionMappingDefinition',
    DestinyFactionDefinition = 'DestinyFactionDefinition',
    DestinyVendorGroupDefinition = 'DestinyVendorGroupDefinition',
    DestinyRewardSourceDefinition = 'DestinyRewardSourceDefinition',
    DestinyUnlockValueDefinition = 'DestinyUnlockValueDefinition',
    DestinyRewardMappingDefinition = 'DestinyRewardMappingDefinition',
    DestinyRewardSheetDefinition = 'DestinyRewardSheetDefinition',
    DestinyItemCategoryDefinition = 'DestinyItemCategoryDefinition',
    DestinyDamageTypeDefinition = 'DestinyDamageTypeDefinition',
    DestinyActivityModeDefinition = 'DestinyActivityModeDefinition',
    DestinyMedalTierDefinition = 'DestinyMedalTierDefinition',
    DestinyAchievementDefinition = 'DestinyAchievementDefinition',
    DestinyActivityGraphDefinition = 'DestinyActivityGraphDefinition',
    DestinyActivityInteractableDefinition = 'DestinyActivityInteractableDefinition',
    DestinyBondDefinition = 'DestinyBondDefinition',
    DestinyCharacterCustomizationCategoryDefinition = 'DestinyCharacterCustomizationCategoryDefinition',
    DestinyCharacterCustomizationOptionDefinition = 'DestinyCharacterCustomizationOptionDefinition',
    DestinyCollectibleDefinition = 'DestinyCollectibleDefinition',
    DestinyDestinationDefinition = 'DestinyDestinationDefinition',
    DestinyEntitlementOfferDefinition = 'DestinyEntitlementOfferDefinition',
    DestinyEquipmentSlotDefinition = 'DestinyEquipmentSlotDefinition',
    DestinyEventCardDefinition = 'DestinyEventCardDefinition',
    DestinyStatDefinition = 'DestinyStatDefinition',
    DestinyInventoryItemDefinition = 'DestinyInventoryItemDefinition',
    DestinyInventoryItemLiteDefinition = 'DestinyInventoryItemLiteDefinition',
    DestinyItemTierTypeDefinition = 'DestinyItemTierTypeDefinition',
    DestinyLocationDefinition = 'DestinyLocationDefinition',
    DestinyLoreDefinition = 'DestinyLoreDefinition',
    DestinyMaterialRequirementSetDefinition = 'DestinyMaterialRequirementSetDefinition',
    DestinyMetricDefinition = 'DestinyMetricDefinition',
    DestinyObjectiveDefinition = 'DestinyObjectiveDefinition',
    DestinyPlatformBucketMappingDefinition = 'DestinyPlatformBucketMappingDefinition',
    DestinyPlugSetDefinition = 'DestinyPlugSetDefinition',
    DestinyPowerCapDefinition = 'DestinyPowerCapDefinition',
    DestinyPresentationNodeDefinition = 'DestinyPresentationNodeDefinition',
    DestinyProgressionDefinition = 'DestinyProgressionDefinition',
    DestinyProgressionLevelRequirementDefinition = 'DestinyProgressionLevelRequirementDefinition',
    DestinyRecordDefinition = 'DestinyRecordDefinition',
    DestinyRewardAdjusterPointerDefinition = 'DestinyRewardAdjusterPointerDefinition',
    DestinyRewardAdjusterProgressionMapDefinition = 'DestinyRewardAdjusterProgressionMapDefinition',
    DestinyRewardItemListDefinition = 'DestinyRewardItemListDefinition',
    DestinySackRewardItemListDefinition = 'DestinySackRewardItemListDefinition',
    DestinySandboxPatternDefinition = 'DestinySandboxPatternDefinition',
    DestinySeasonDefinition = 'DestinySeasonDefinition',
    DestinySeasonPassDefinition = 'DestinySeasonPassDefinition',
    DestinySocketCategoryDefinition = 'DestinySocketCategoryDefinition',
    DestinySocketTypeDefinition = 'DestinySocketTypeDefinition',
    DestinyTraitDefinition = 'DestinyTraitDefinition',
    DestinyTraitCategoryDefinition = 'DestinyTraitCategoryDefinition',
    DestinyUnlockCountMappingDefinition = 'DestinyUnlockCountMappingDefinition',
    DestinyUnlockEventDefinition = 'DestinyUnlockEventDefinition',
    DestinyUnlockExpressionMappingDefinition = 'DestinyUnlockExpressionMappingDefinition',
    DestinyVendorDefinition = 'DestinyVendorDefinition',
    DestinyMilestoneDefinition = 'DestinyMilestoneDefinition',
    DestinyActivityModifierDefinition = 'DestinyActivityModifierDefinition',
    DestinyReportReasonCategoryDefinition = 'DestinyReportReasonCategoryDefinition',
    DestinyArtifactDefinition = 'DestinyArtifactDefinition',
    DestinyBreakerTypeDefinition = 'DestinyBreakerTypeDefinition',
    DestinyChecklistDefinition = 'DestinyChecklistDefinition',
    DestinyEnergyTypeDefinition = 'DestinyEnergyTypeDefinition'
}

// Loads the manifest from the API
// https://bungie-net.github.io/#/components/schemas/Destiny.Definitions.DestinyDefinition
export async function getManifest(token: string): Promise<D2APIResponse<D2APIManifestResponse | null>> {
    const json: D2APIResponse<D2APIManifestResponse | null> = 
        await (await fetch(`${D2APIRoot}/Destiny2/Manifest/`, {
            headers: {
                'X-API-Key': token
            }
        })).json()

    return json
}