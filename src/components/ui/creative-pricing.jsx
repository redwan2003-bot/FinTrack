import { Button } from "./button";
import { Check, Sparkles, Star } from "lucide-react";
import { cn } from "../../lib/utils";
import { useTranslation } from "../../lib/i18n";

function CreativePricing({
    tag = "Simple Pricing",
    title = "Make Short Videos That Pop",
    description = "Edit, enhance, and go viral in minutes",
    tiers,
}) {
    const { t } = useTranslation();
    return (
        <div className="w-full max-w-6xl mx-auto px-4">
            <div className="text-center space-y-6 mb-16">
                <div className="font-handwritten text-xl text-blue-500 rotate-[-1deg]">
                    {tag}
                </div>
                <div className="relative">
                    <h2 className="text-4xl md:text-5xl font-bold font-handwritten text-white rotate-[-1deg]">
                        {title}
                        <div className="absolute -right-12 top-0 text-amber-500 rotate-12">
                            <Sparkles className="w-8 h-8" />
                        </div>
                        <div className="absolute -left-8 bottom-0 text-primary -rotate-12">
                            <Star className="w-8 h-8" />
                        </div>
                    </h2>
                    <div
                        className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-44 h-3 bg-blue-500/20 
                        rotate-[-1deg] rounded-full blur-sm"
                    />
                </div>
                <p className="font-handwritten text-xl text-zinc-300 rotate-[-1deg]">
                    {description}
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {tiers.map((tier, index) => (
                    <div
                        key={tier.name}
                        className={cn(
                            "relative group",
                            "transition-all duration-300",
                            index === 0 && "rotate-[-1deg]",
                            index === 1 && "rotate-[1deg]",
                            index === 2 && "rotate-[-2deg]"
                        )}
                    >
                        <div
                            className={cn(
                                "absolute inset-0 bg-transparent",
                                "rounded-lg transition-all duration-300",
                                "group-hover:shadow-[0_0_30px_rgba(124,58,237,0.4)]",
                                "group-hover:bg-[rgba(255,255,255,0.03)]"
                            )}
                        />

                        <div className="relative p-6">
                            {tier.popular && (
                                <div
                                    className="absolute -top-2 -right-2 bg-amber-400 text-zinc-900 
                                    font-handwritten px-3 py-1 rounded-full rotate-12 text-sm border-2 border-zinc-900"
                                >
                                    {t('popular')}
                                </div>
                            )}

                            <div className="mb-6">
                                <div
                                    className={cn(
                                        "w-12 h-12 rounded-full mb-4",
                                        "flex items-center justify-center",
                                        "bg-[rgba(255,255,255,0.05)]",
                                        `text-${tier.color}-400`
                                    )}
                                >
                                    {tier.icon}
                                </div>
                                <h3 className="font-handwritten text-2xl text-white">
                                    {tier.name}
                                </h3>
                                <p className="font-handwritten text-zinc-400">
                                    {tier.description}
                                </p>
                            </div>

                            {/* Price */}
                            <div className="mb-6 font-handwritten">
                                <span className="text-4xl font-bold text-white">
                                    ৳{tier.price}
                                </span>
                                <span className="text-zinc-400">
                                    /{t('month')}
                                </span>
                            </div>

                            <div className="space-y-3 mb-6">
                                {tier.features.map((feature) => (
                                    <div
                                        key={feature}
                                        className="flex items-center gap-3"
                                    >
                                        <div
                                            className="w-5 h-5 rounded-full bg-[rgba(255,255,255,0.05)] 
                                            flex items-center justify-center text-primary"
                                        >
                                            <Check className="w-3 h-3" />
                                        </div>
                                        <span className="font-handwritten text-lg text-white">
                                            {feature}
                                        </span>
                                    </div>
                                ))}
                            </div>

                            <Button
                                className={cn(
                                    "w-full h-12 font-handwritten text-lg relative",
                                    "transition-all duration-300 border-0",
                                    tier.popular
                                        ? [
                                              "bg-primary text-white",
                                              "hover:shadow-[0_0_20px_var(--primary)]",
                                              "hover:bg-[#9333ea]"
                                          ]
                                        : [
                                              "bg-[rgba(255,255,255,0.05)] text-white",
                                              "hover:bg-[rgba(255,255,255,0.1)]",
                                              "hover:shadow-[0_0_15px_rgba(255,255,255,0.2)]"
                                          ]
                                )}
                            >
                                {t('get_started')}
                            </Button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}


export { CreativePricing }
